import fs from "fs";
import csv from "csv-parser";
import axios from "axios";
import dotenv from "dotenv";
import cliProgress from "cli-progress";
import colors from "ansi-colors";

dotenv.config();

const API_BASE_URL = "http://localhost:3000/api";
const ADMIN_EMAIL = process.env.BULK_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.BULK_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Set BULK_ADMIN_EMAIL and BULK_ADMIN_PASSWORD in backend/.env before importing.");
}
const CSV_FILE_PATH =
  "Test.csv";

// Delay between requests to avoid overwhelming the email service
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds
const MAX_RETRIES = 3;

// Statistics
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to clean and validate data
const cleanData = (row) => {
  const teamName = row["Team Name"]?.trim();
  const leaderName = row["Team Leader Name"]?.trim();
  const leaderEmail = row["Team Leader Email"]?.trim().toLowerCase();
  const teamSize = parseInt(row["Number of Team members"]);

  return {
    teamName,
    leaderName,
    leaderEmail,
    teamSize,
    isValid:
      teamName && leaderName && validateEmail(leaderEmail) && teamSize > 0,
  };
};

// Get admin token
const getAdminToken = async () => {
  try {
    console.log(colors.cyan("\n🔐 Logging in as admin...\n"));
    const response = await axios.post(`${API_BASE_URL}/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (response.data.status === 200 && response.data.data.token) {
      console.log(colors.green("✓ Admin login successful\n"));
      return response.data.data.token;
    }
    throw new Error("Failed to get admin token");
  } catch (error) {
    console.error(
      colors.red("✗ Admin login failed:"),
      error.response?.data?.message || error.message
    );
    throw error;
  }
};

// Register a single participant with retry logic
const registerParticipant = async (data, token, retryCount = 0) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/participants/register`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return {
      success: true,
      data: response.data,
      teamName: data.teamName,
    };
  } catch (error) {
    // Check if it's a conflict (already registered)
    if (error.response?.status === 409) {
      return {
        success: false,
        skipped: true,
        teamName: data.teamName,
        reason: "Already registered",
      };
    }

    // Retry logic for network errors
    if (
      retryCount < MAX_RETRIES &&
      (!error.response || error.response.status >= 500)
    ) {
      console.log(
        colors.yellow(
          `\n⚠️  Retrying ${data.teamName} (Attempt ${
            retryCount + 1
          }/${MAX_RETRIES})...`
        )
      );
      await delay(DELAY_BETWEEN_REQUESTS * (retryCount + 1)); // Exponential backoff
      return registerParticipant(data, token, retryCount + 1);
    }

    return {
      success: false,
      teamName: data.teamName,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Read and process CSV file
const processCSV = async () => {
  console.log(colors.cyan.bold("\n🚀 Starting Bulk Registration Process\n"));
  console.log(colors.gray("=".repeat(60)));

  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(colors.red(`\n✗ CSV file not found: ${CSV_FILE_PATH}\n`));
    process.exit(1);
  }

  // Get admin token
  let token;
  try {
    token = await getAdminToken();
  } catch (error) {
    console.error(colors.red("\n✗ Failed to authenticate. Exiting...\n"));
    process.exit(1);
  }

  // Read and parse CSV
  const teams = [];
  const duplicateEmails = new Set();
  const emailTracker = new Map();

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on("data", (row) => {
        const cleanedData = cleanData(row);

        if (!cleanedData.isValid) {
          stats.skipped++;
          stats.errors.push({
            teamName: cleanedData.teamName || "Unknown",
            reason: "Invalid data",
          });
          return;
        }

        // Check for duplicate emails in CSV
        if (emailTracker.has(cleanedData.leaderEmail)) {
          duplicateEmails.add(cleanedData.leaderEmail);
          stats.skipped++;
          stats.errors.push({
            teamName: cleanedData.teamName,
            reason: `Duplicate email in CSV (also in ${emailTracker.get(
              cleanedData.leaderEmail
            )})`,
          });
          return;
        }

        emailTracker.set(cleanedData.leaderEmail, cleanedData.teamName);
        teams.push(cleanedData);
      })
      .on("end", async () => {
        stats.total = teams.length;

        console.log(colors.cyan(`\n📊 CSV Processing Complete:`));
        console.log(colors.white(`   Total valid teams found: ${stats.total}`));
        console.log(
          colors.yellow(`   Skipped (invalid/duplicate): ${stats.skipped}`)
        );

        if (duplicateEmails.size > 0) {
          console.log(
            colors.yellow(
              `\n⚠️  Found ${duplicateEmails.size} duplicate email(s) in CSV`
            )
          );
        }

        if (stats.total === 0) {
          console.log(
            colors.red("\n✗ No valid teams to register. Exiting...\n")
          );
          process.exit(0);
        }

        console.log(colors.cyan(`\n🔄 Starting registration process...\n`));
        console.log(colors.gray("=".repeat(60)));

        // Create progress bar
        const progressBar = new cliProgress.SingleBar({
          format:
            colors.cyan("{bar}") +
            " | {percentage}% | {value}/{total} Teams | ETA: {eta}s | {status}",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        });

        progressBar.start(stats.total, 0, { status: "Starting..." });

        // Process teams one by one with delay
        for (let i = 0; i < teams.length; i++) {
          const team = teams[i];
          const result = await registerParticipant(team, token);

          if (result.success) {
            stats.successful++;
            progressBar.update(i + 1, {
              status: colors.green(`✓ ${team.teamName}`),
            });
          } else if (result.skipped) {
            stats.skipped++;
            progressBar.update(i + 1, {
              status: colors.yellow(`⊘ ${team.teamName} (${result.reason})`),
            });
          } else {
            stats.failed++;
            stats.errors.push({
              teamName: team.teamName,
              reason: result.error,
            });
            progressBar.update(i + 1, {
              status: colors.red(`✗ ${team.teamName}`),
            });
          }

          // Add delay between requests (except for last one)
          if (i < teams.length - 1) {
            await delay(DELAY_BETWEEN_REQUESTS);
          }
        }

        progressBar.stop();
        resolve();
      })
      .on("error", (error) => {
        console.error(colors.red("\n✗ Error reading CSV file:"), error.message);
        reject(error);
      });
  });
};

// Main function
const main = async () => {
  try {
    await processCSV();

    // Print final statistics
    console.log(
      colors.cyan.bold("\n\n📈 Registration Complete - Final Statistics:\n")
    );
    console.log(colors.gray("=".repeat(60)));
    console.log(colors.white(`   Total Teams Processed: ${stats.total}`));
    console.log(
      colors.green(`   ✓ Successfully Registered: ${stats.successful}`)
    );
    console.log(colors.yellow(`   ⊘ Skipped: ${stats.skipped}`));
    console.log(colors.red(`   ✗ Failed: ${stats.failed}`));
    console.log(colors.gray("=".repeat(60)));

    // Print errors if any
    if (stats.errors.length > 0) {
      console.log(colors.red.bold("\n\n❌ Errors & Skipped Teams:\n"));
      console.log(colors.gray("=".repeat(60)));
      stats.errors.forEach((error, index) => {
        console.log(colors.red(`   ${index + 1}. ${error.teamName}`));
        console.log(colors.gray(`      Reason: ${error.reason}\n`));
      });
    }

    // Save detailed log
    const logData = {
      timestamp: new Date().toISOString(),
      statistics: stats,
      errors: stats.errors,
    };

    fs.writeFileSync(
      `./registration-log-${Date.now()}.json`,
      JSON.stringify(logData, null, 2)
    );

    console.log(
      colors.green("\n✓ Detailed log saved to registration-log-*.json\n")
    );

    process.exit(0);
  } catch (error) {
    console.error(colors.red("\n\n✗ Fatal error:"), error.message);
    process.exit(1);
  }
};

// Run the script
main();

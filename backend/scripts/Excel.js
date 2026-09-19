import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cliProgress from "cli-progress";
import colors from "ansi-colors";
import { Participant } from "../models/index.js";

dotenv.config();

const CSV_INPUT_PATH = "./Celestia 2025 - Registration.csv";
const CSV_OUTPUT_PATH = "./Celestia 2025 - Registration_Filled.csv";

// Statistics
const stats = {
  total: 0,
  filled: 0,
  notFound: 0,
  errors: [],
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/celestia"
    );
    console.log(colors.green("✓ Connected to MongoDB\n"));
  } catch (error) {
    console.error(colors.red("✗ MongoDB connection failed:"), error.message);
    process.exit(1);
  }
};

// Find participant by team ID
const findParticipantByTeamId = async (teamId) => {
  try {
    const participant = await Participant.findOne({
      teamId: parseInt(teamId),
    }).select("teamId teamName leaderName leaderEmail");

    return participant;
  } catch (error) {
    console.error(
      colors.red(`Error finding team ID ${teamId}:`),
      error.message
    );
    return null;
  }
};

// Process CSV
const processCSV = async () => {
  console.log(colors.cyan.bold("🚀 Starting Registration Data Fill Process\n"));
  console.log(colors.gray("=".repeat(60)));

  // Check if CSV exists
  if (!fs.existsSync(CSV_INPUT_PATH)) {
    console.error(colors.red(`\n✗ CSV file not found: ${CSV_INPUT_PATH}\n`));
    process.exit(1);
  }

  const registrations = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_INPUT_PATH)
      .pipe(csv())
      .on("data", (row) => {
        const teamId = row["Team Id"]?.trim();
        const teamName = row["Team Name"]?.trim() || "";
        const teamLeader = row["Team Leader"]?.trim() || "";
        const leaderEmail = row["Leader Email"]?.trim() || "";

        if (teamId) {
          registrations.push({
            teamId,
            teamName,
            teamLeader,
            leaderEmail,
          });
        }
      })
      .on("end", async () => {
        stats.total = registrations.length;
        console.log(colors.cyan(`\n📊 CSV Read Complete:`));
        console.log(
          colors.white(`   Total team IDs found in CSV: ${stats.total}\n`)
        );

        if (stats.total === 0) {
          console.log(colors.red("✗ No team IDs to process. Exiting...\n"));
          await mongoose.connection.close();
          process.exit(0);
        }

        console.log(colors.cyan("🔍 Fetching data from MongoDB...\n"));
        console.log(colors.gray("=".repeat(60)));

        // Create progress bar
        const progressBar = new cliProgress.SingleBar({
          format:
            colors.cyan("{bar}") +
            " | {percentage}% | {value}/{total} Teams | {status}",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        });

        progressBar.start(stats.total, 0, { status: "Starting..." });

        // Process each registration
        for (let i = 0; i < registrations.length; i++) {
          const registration = registrations[i];

          // Skip if already filled
          if (
            registration.teamName &&
            registration.teamLeader &&
            registration.leaderEmail
          ) {
            progressBar.update(i + 1, {
              status: colors.gray(`⊘ ${registration.teamId} (Already filled)`),
            });
            continue;
          }

          const participant = await findParticipantByTeamId(
            registration.teamId
          );

          if (participant) {
            // Fill empty fields
            registration.teamName =
              registration.teamName || participant.teamName || "";
            registration.teamLeader =
              registration.teamLeader || participant.leaderName || "";
            registration.leaderEmail =
              registration.leaderEmail || participant.leaderEmail || "";

            stats.filled++;
            progressBar.update(i + 1, {
              status: colors.green(
                `✓ ${registration.teamId} - ${participant.teamName}`
              ),
            });
          } else {
            stats.notFound++;
            stats.errors.push({
              teamId: registration.teamId,
              reason: "Team ID not found in database",
            });
            progressBar.update(i + 1, {
              status: colors.red(`✗ ${registration.teamId} (Not found)`),
            });
          }
        }

        progressBar.stop();

        // Write updated CSV
        console.log(colors.cyan("\n\n💾 Writing filled CSV file...\n"));

        const csvWriter = createObjectCsvWriter({
          path: CSV_OUTPUT_PATH,
          header: [
            { id: "teamId", title: "Team Id" },
            { id: "teamName", title: "Team Name" },
            { id: "teamLeader", title: "Team Leader" },
            { id: "leaderEmail", title: "Leader Email" },
          ],
        });

        await csvWriter.writeRecords(registrations);

        console.log(
          colors.green(`✓ Filled CSV saved to: ${CSV_OUTPUT_PATH}\n`)
        );

        resolve();
      })
      .on("error", (error) => {
        console.error(colors.red("\n✗ Error reading CSV:"), error.message);
        reject(error);
      });
  });
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await processCSV();

    // Print statistics
    console.log(colors.cyan.bold("\n📈 Fill Complete - Final Statistics:\n"));
    console.log(colors.gray("=".repeat(60)));
    console.log(colors.white(`   Total Team IDs in CSV: ${stats.total}`));
    console.log(colors.green(`   ✓ Filled from Database: ${stats.filled}`));
    console.log(colors.red(`   ✗ Not Found: ${stats.notFound}`));
    console.log(colors.gray("=".repeat(60)));

    // Print not found teams
    if (stats.errors.length > 0) {
      console.log(colors.red.bold("\n\n❌ Team IDs Not Found in Database:\n"));
      console.log(colors.gray("=".repeat(60)));
      stats.errors.forEach((error, index) => {
        console.log(colors.red(`   ${index + 1}. Team ID: ${error.teamId}`));
      });
      console.log(colors.gray("=".repeat(60)));
    }

    // Save log
    const logData = {
      timestamp: new Date().toISOString(),
      statistics: stats,
      notFoundTeams: stats.errors,
    };

    fs.writeFileSync(
      `./registration-fill-log-${Date.now()}.json`,
      JSON.stringify(logData, null, 2)
    );

    console.log(
      colors.green("\n✓ Detailed log saved to registration-fill-log-*.json\n")
    );

    await mongoose.connection.close();
    console.log(colors.green("✓ MongoDB connection closed\n"));

    process.exit(0);
  } catch (error) {
    console.error(colors.red("\n\n✗ Fatal error:"), error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
main();

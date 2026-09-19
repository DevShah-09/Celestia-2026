import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cliProgress from "cli-progress";
import colors from "ansi-colors";
import { Participant } from "../models/index.js";

dotenv.config();

const CSV_INPUT_PATH = "./Untitled spreadsheet - Sheet1.csv";
const CSV_OUTPUT_PATH = "./Updated_Team_IDs.csv";

// Statistics
const stats = {
  total: 0,
  found: 0,
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

// Find team by name (case-insensitive, trim spaces)
const findTeamByName = async (teamName) => {
  try {
    const cleanedName = teamName.trim();

    // Try exact match first (case-insensitive)
    const participant = await Participant.findOne({
      teamName: { $regex: new RegExp(`^${cleanedName}$`, "i") },
    }).select("teamId teamName");

    return participant;
  } catch (error) {
    console.error(colors.red(`Error finding team: ${teamName}`), error.message);
    return null;
  }
};

// Process CSV
const processCSV = async () => {
  console.log(colors.cyan.bold("🚀 Starting Team ID Update Process\n"));
  console.log(colors.gray("=".repeat(60)));

  // Check if CSV exists
  if (!fs.existsSync(CSV_INPUT_PATH)) {
    console.error(colors.red(`\n✗ CSV file not found: ${CSV_INPUT_PATH}\n`));
    process.exit(1);
  }

  const teams = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_INPUT_PATH)
      .pipe(csv())
      .on("data", (row) => {
        const teamName = row["Team Name"]?.trim();
        const points = row["Points"]?.trim() || "";
        const existingTeamId = row["Team Id"]?.trim() || "";

        if (teamName && teamName !== "Team Name") {
          // Skip header if present
          teams.push({
            teamName,
            points,
            existingTeamId,
            foundTeamId: "",
          });
        }
      })
      .on("end", async () => {
        stats.total = teams.length;
        console.log(colors.cyan(`\n📊 CSV Read Complete:`));
        console.log(
          colors.white(`   Total teams found in CSV: ${stats.total}\n`)
        );

        if (stats.total === 0) {
          console.log(colors.red("✗ No teams to process. Exiting...\n"));
          await mongoose.connection.close();
          process.exit(0);
        }

        console.log(colors.cyan("🔍 Looking up teams in MongoDB...\n"));
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

        // Process each team
        for (let i = 0; i < teams.length; i++) {
          const team = teams[i];
          const participant = await findTeamByName(team.teamName);

          if (participant) {
            team.foundTeamId = participant.teamId;
            stats.found++;
            progressBar.update(i + 1, {
              status: colors.green(`✓ ${team.teamName}`),
            });
          } else {
            stats.notFound++;
            stats.errors.push({
              teamName: team.teamName,
              reason: "Not found in database",
            });
            progressBar.update(i + 1, {
              status: colors.red(`✗ ${team.teamName}`),
            });
          }
        }

        progressBar.stop();

        // Write updated CSV
        console.log(colors.cyan("\n\n💾 Writing updated CSV file...\n"));

        const csvWriter = createObjectCsvWriter({
          path: CSV_OUTPUT_PATH,
          header: [
            { id: "teamName", title: "Team Name" },
            { id: "points", title: "Points" },
            { id: "foundTeamId", title: "Team Id" },
          ],
        });

        await csvWriter.writeRecords(teams);

        console.log(
          colors.green(`✓ Updated CSV saved to: ${CSV_OUTPUT_PATH}\n`)
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
    console.log(colors.cyan.bold("\n📈 Update Complete - Final Statistics:\n"));
    console.log(colors.gray("=".repeat(60)));
    console.log(colors.white(`   Total Teams in CSV: ${stats.total}`));
    console.log(colors.green(`   ✓ Found in Database: ${stats.found}`));
    console.log(colors.red(`   ✗ Not Found: ${stats.notFound}`));
    console.log(colors.gray("=".repeat(60)));

    // Print not found teams
    if (stats.errors.length > 0) {
      console.log(colors.red.bold("\n\n❌ Teams Not Found in Database:\n"));
      console.log(colors.gray("=".repeat(60)));
      stats.errors.forEach((error, index) => {
        console.log(colors.red(`   ${index + 1}. ${error.teamName}`));
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
      `./team-id-update-log-${Date.now()}.json`,
      JSON.stringify(logData, null, 2)
    );

    console.log(
      colors.green("\n✓ Detailed log saved to team-id-update-log-*.json\n")
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

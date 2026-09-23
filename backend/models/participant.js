import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    leaderName: {
      type: String,
      required: true,
      trim: true,
    },
    leaderEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    teamId: {
      type: Number,
      required: true,
      unique: true,
    },
    teamSize: {
      type: Number,
      default: 1,
      required: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    gameProgress: [
      {
        gameId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Game",
          default: null, // Allow null for penalties
        },
        points: {
          type: Number,
          default: 0,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          adminId: mongoose.Schema.Types.ObjectId,
          adminName: String,
          adminEmail: String,
        },
        operationId: String,
        bettingAction: { type: String, enum: ['stake', 'payout'] },
        // Gambling game specific fields
        pointsBet: {
          type: Number,
          default: null,
        },
        // Auction game specific
        cupNumber: {
          type: Number,
          default: null,
        },
        multiplier: {
          type: Number,
          default: null,
        },
        // Auction outcome
        didWin: {
          type: Boolean,
          default: null,
        },
        gameType: {
          type: String,
          enum: ['regular', 'auction'],
          default: 'regular',
        },
        penalty: {
          reason: String,
          isDeduction: {
            type: Boolean,
            default: false,
          },
        },
      },
    ],
    pointsBet: {
      type: Number,
      default: 0,
    },
    // Active gambling game details
    activeGamblingGame: {
      gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        default: null,
      },
      gameType: {
        type: String,
        enum: ['auction'],
        default: null,
      },
      cupNumber: {
        type: Number,
        default: null,
      },
      betPlacedAt: {
        type: Date,
        default: null,
      },
    },
    // Missing on historical teams: these are deliberately excluded from automatic delivery.
    emailStatus: { type: String, enum: ['pending', 'sending', 'sent', 'failed'], default: 'pending', index: true },
    emailSentAt: { type: Date, default: null },
    emailAttemptedAt: { type: Date, default: null },
    emailAttempts: { type: Number, default: 0 },
    qrCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Participant", participantSchema);

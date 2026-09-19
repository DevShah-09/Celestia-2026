// import mongoose from "mongoose";

// const participantSchema = new mongoose.Schema(
//   {
//     leaderName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     leaderEmail: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     teamName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     teamId: {
//       type: Number,
//       required: true,
//       unique: true,
//     },
//     teamSize: {
//       type: Number,
//       default: 1,
//       required: true,
//     },
//     totalPoints: {
//       type: Number,
//       default: 0,
//     },
//     gameProgress: [
//       {
//         gameId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Game",
//         },
//         points: {
//           type: Number,
//           default: 0,
//         },
//         completedAt: {
//           type: Date,
//           default: Date.now,
//         },
//         assignedBy: {
//           adminId: mongoose.Schema.Types.ObjectId,
//           adminName: String,
//           adminEmail: String,
//         },
//         // Gambling game specific fields
//         pointsBet: {
//           type: Number,
//           default: null,
//         },
//         // Camel race specific
//         camelNumber: {
//           type: Number,
//           default: null,
//         },
//         // Auction game specific
//         cupNumber: {
//           type: Number,
//           default: null,
//         },
//         multiplier: {
//           type: Number,
//           default: null,
//         },
//         // Common for both
//         didWin: {
//           type: Boolean,
//           default: null,
//         },
//         gameType: {
//           type: String,
//           enum: ['regular', 'camel-race', 'auction'],
//           default: 'regular',
//         },
//       },
//     ],
//     // Current active bet - only ONE bet at a time
//     // This will be displayed on dashboard
//     pointsBet: {
//       type: Number,
//       default: 0,
//     },
//     // Active gambling game details
//     activeGamblingGame: {
//       gameId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Game",
//         default: null,
//       },
//       gameType: {
//         type: String,
//         enum: ['camel-race', 'auction'],
//         default: null,
//       },
//       camelNumber: {
//         type: Number,
//         default: null,
//       },
//       cupNumber: {
//         type: Number,
//         default: null,
//       },
//       betPlacedAt: {
//         type: Date,
//         default: null,
//       },
//     },
//     qrCode: {
//       type: String,
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Index for faster queries
// participantSchema.index({ teamId: 1 });
// participantSchema.index({ leaderEmail: 1 });
// participantSchema.index({ totalPoints: -1 });
// participantSchema.index({ 'activeGamblingGame.gameId': 1 });

// export default mongoose.model("Participant", participantSchema);

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

import mongoose from "mongoose";

const adminActionSchema = {
  adminId: mongoose.Schema.Types.ObjectId,
  adminName: String,
  adminEmail: String,
};

const gameSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gameType: {
      type: String,
      enum: ['regular', 'auction'],
      default: 'regular',
    },
    gamePoints: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Auction game specific configuration
    auctionConfig: {
      numberOfCups: {
        type: Number,
        default: 6,
        min: 2,
        max: 10,
      },
      cupMultipliers: {
        type: Map,
        of: Number,
        default: {
          1: null,
          2: null,
          3: null,
          4: null,
          5: null,
          6: null,
        },
      },
      auctionCompleted: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
        default: null,
      },
    },
    createdBy: adminActionSchema,
    updatedBy: {
      ...adminActionSchema,
      updatedAt: Date,
    },
    deactivatedBy: {
      ...adminActionSchema,
      deactivatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
gameSchema.index({ isActive: 1 });
gameSchema.index({ gameType: 1 });

export default mongoose.model("Game", gameSchema);

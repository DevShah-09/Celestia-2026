import { Game } from "../models/index.js";
import { formatResponse, handleError } from "../utils/helpers.js";

export const createGame = async (req, res) => {
  try {
    const { gameName, gamePoints, description, gameType = 'regular' } = req.body;
    if (!['regular', 'auction'].includes(gameType)) return res.status(400).json(formatResponse(null, 'Invalid game type', 400));

    if (!gameName || !gamePoints) {
      return res
        .status(400)
        .json(formatResponse(null, "Game name and points are required", 400));
    }

    const existingGame = await Game.findOne({ gameName });
    if (existingGame) {
      return res
        .status(409)
        .json(formatResponse(null, "Game already exists", 409));
    }

    const game = new Game({
      gameName,
      gameType,
      gamePoints,
      description,
      createdBy: {
        adminId: req.adminId,
        adminName: req.adminName,
        adminEmail: req.adminEmail,
      },
    });

    await game.save();

    res.status(201).json(
      formatResponse(
        {
          ...game.toObject(),
          actionPerformedBy: req.adminName,
        },
        `Game created successfully by ${req.adminName}`,
        201
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};

export const getAllGames = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true })
      .select("gameName gamePoints description createdBy updatedBy gameType auctionConfig")
      .sort({ gameName: 1 });

    res.json(formatResponse(games, "Games retrieved successfully"));
  } catch (error) {
    handleError(error, res);
  }
};

export const getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json(formatResponse(null, "Game not found", 404));
    }

    res.json(formatResponse(game, "Game retrieved successfully"));
  } catch (error) {
    handleError(error, res);
  }
};

export const updateGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const updateData = Object.fromEntries(['gameName', 'gamePoints', 'description'].filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    if (updateData.gameName !== undefined) {
      if (typeof updateData.gameName !== 'string' || !updateData.gameName.trim()) return res.status(400).json(formatResponse(null, 'Game name is required', 400));
      updateData.gameName = updateData.gameName.trim();
    }
    if (updateData.gamePoints !== undefined && (!Number.isSafeInteger(updateData.gamePoints) || updateData.gamePoints <= 0)) return res.status(400).json(formatResponse(null, 'Points must be a positive whole number', 400));

    // Add admin info to update
    updateData.updatedBy = {
      adminId: req.adminId,
      adminName: req.adminName,
      adminEmail: req.adminEmail,
      updatedAt: new Date(),
    };

    const game = await Game.findByIdAndUpdate(gameId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!game) {
      return res.status(404).json(formatResponse(null, "Game not found", 404));
    }

    res.json(
      formatResponse(
        {
          ...game.toObject(),
          actionPerformedBy: req.adminName,
        },
        `Game updated successfully by ${req.adminName}`
      )
    );
  } catch (error) {
    if (error.code === 11000) return res.status(409).json(formatResponse(null, "Game already exists", 409));
    handleError(error, res);
  }
};

export const deleteGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByIdAndUpdate(
      gameId,
      {
        isActive: false,
        deactivatedBy: {
          adminId: req.adminId,
          adminName: req.adminName,
          adminEmail: req.adminEmail,
          deactivatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!game) {
      return res.status(404).json(formatResponse(null, "Game not found", 404));
    }

    res.json(
      formatResponse(
        {
          ...game.toObject(),
          actionPerformedBy: req.adminName,
        },
        `Game deactivated successfully by ${req.adminName}`
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};

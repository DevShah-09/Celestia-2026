import { Game } from "../models/index.js";
import { formatResponse, handleError } from "../utils/helpers.js";

export const createGame = async (req, res) => {
  try {
    const { gameName, gamePoints, description } = req.body;

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
      .select("gameName gamePoints description createdBy updatedBy")
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
    const updateData = req.body;

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

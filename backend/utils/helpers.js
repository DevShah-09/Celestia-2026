import { Participant } from "../models/index.js";

export const formatResponse = (data, message = "Success", status = 200) => {
  return {
    status,
    message,
    data,
  };
};

export const handleError = (error, res) => {
  console.error(error);
  res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: error.message,
  });
};

// export const generateTeamId = () => {
//   return `CELESTIA-${uuidv4().split("-")[0].toUpperCase()}`;
// };

export const generateTeamId = async () => {
  const count = await Participant.countDocuments();
  console.log("Current participant count:", count);
  return 1000 + count;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

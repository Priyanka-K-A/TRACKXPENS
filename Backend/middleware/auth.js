const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No authentication token, access denied"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found, token invalid"
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token"
      });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired, please login again"
      });
    }

    res.status(500).json({
      status: "error",
      message: "Authentication error"
    });
  }
};

module.exports = auth;

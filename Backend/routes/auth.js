const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "30d";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide username, email, and password"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: existingUser.email === email 
          ? "Email already registered" 
          : "Username already taken"
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          currency: user.currency
        }
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Server error during registration"
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email and password"
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          currency: user.currency,
          monthlyBudget: user.monthlyBudget,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error during login"
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    res.json({
      status: "success",
      data: { user }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const { username, currency, monthlyBudget, preferences } = req.body;

    const user = await User.findById(req.userId);

    if (username) user.username = username;
    if (currency) user.currency = currency;
    if (monthlyBudget !== undefined) user.monthlyBudget = monthlyBudget;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          currency: user.currency,
          monthlyBudget: user.monthlyBudget,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error during profile update"
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Please provide current and new password"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 6 characters"
      });
    }

    const user = await User.findById(req.userId).select("+password");

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect"
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      status: "success",
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error during password change"
    });
  }
});

module.exports = router;

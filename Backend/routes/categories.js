const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

// Predefined categories with icons and colors
const CATEGORIES = [
  {
    id: "salary",
    name: "Salary",
    type: "income",
    icon: "💰",
    color: "#4caf50",
    description: "Monthly salary and wages"
  },
  {
    id: "housing",
    name: "Housing",
    type: "expense",
    icon: "🏠",
    color: "#ff4d4f",
    description: "Rent, mortgage, property taxes"
  },
  {
    id: "transport",
    name: "Transport",
    type: "expense",
    icon: "🚗",
    color: "#ffc107",
    description: "Vehicle, fuel, public transport"
  },
  {
    id: "food",
    name: "Food",
    type: "expense",
    icon: "🍔",
    color: "#2196f3",
    description: "Groceries and dining out"
  },
  {
    id: "healthcare",
    name: "Healthcare",
    type: "expense",
    icon: "🏥",
    color: "#9c27b0",
    description: "Medical expenses and insurance"
  },
  {
    id: "shopping",
    name: "Shopping",
    type: "expense",
    icon: "🛍️",
    color: "#ff9800",
    description: "Clothing, electronics, personal items"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    type: "expense",
    icon: "🎬",
    color: "#e91e63",
    description: "Movies, games, hobbies"
  },
  {
    id: "education",
    name: "Education",
    type: "expense",
    icon: "📚",
    color: "#3f51b5",
    description: "Courses, books, tuition"
  },
  {
    id: "utilities",
    name: "Utilities",
    type: "expense",
    icon: "⚡",
    color: "#607d8b",
    description: "Electricity, water, internet"
  },
  {
    id: "investment",
    name: "Investment",
    type: "income",
    icon: "📈",
    color: "#00bcd4",
    description: "Stocks, dividends, returns"
  },
  {
    id: "others",
    name: "Others",
    type: "both",
    icon: "📦",
    color: "#888888",
    description: "Miscellaneous transactions"
  }
];

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public (or Private if you want)
router.get("/", (req, res) => {
  try {
    const { type } = req.query;

    let categories = CATEGORIES;

    // Filter by type if provided
    if (type) {
      categories = CATEGORIES.filter(
        cat => cat.type === type || cat.type === "both"
      );
    }

    res.json({
      status: "success",
      results: categories.length,
      data: { categories }
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching categories"
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get("/:id", (req, res) => {
  try {
    const category = CATEGORIES.find(cat => cat.id === req.params.id);

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Category not found"
      });
    }

    res.json({
      status: "success",
      data: { category }
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching category"
    });
  }
});

module.exports = router;

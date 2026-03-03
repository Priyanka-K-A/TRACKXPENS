const express = require("express");
const Item = require("../models/Item");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// @route   GET /api/items
// @desc    Get all items for logged-in user
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 100, page = 1 } = req.query;

    // Build query
    const query = { user: req.userId };

    if (type) query.type = parseInt(type);
    if (category) query.category = category.toLowerCase();

    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Item.countDocuments(query);

    // Calculate summary
    const expenses = await Item.aggregate([
      { $match: { user: req.user._id, type: 1 } },
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);

    const income = await Item.aggregate([
      { $match: { user: req.user._id, type: 2 } },
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);

    const totalExpenses = expenses[0]?.total || 0;
    const totalIncome = income[0]?.total || 0;

    res.json({
      status: "success",
      results: items.length,
      data: {
        items,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: {
          totalExpenses,
          totalIncome,
          balance: totalIncome - totalExpenses
        }
      }
    });
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching items"
    });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }

    res.json({
      status: "success",
      data: { item }
    });
  } catch (error) {
    console.error("Get item error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching item"
    });
  }
});

// @route   POST /api/items
// @desc    Create new item
// @access  Private
router.post("/", async (req, res) => {
  try {
    const { name, value, type, category, date, description, paymentMethod, tags } = req.body;

    // Validation
    if (!name || !value || !type || !category) {
      return res.status(400).json({
        status: "error",
        message: "Please provide name, value, type, and category"
      });
    }

    if (value <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Amount must be greater than 0"
      });
    }

    const item = new Item({
      user: req.userId,
      name,
      value: parseFloat(value),
      type: parseInt(type),
      category: category.toLowerCase(),
      date: date || new Date(),
      description,
      paymentMethod,
      tags
    });

    await item.save();

    res.status(201).json({
      status: "success",
      message: "Item created successfully",
      data: { item }
    });
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Error creating item"
    });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    const { name, value, type, category, date, description, paymentMethod, tags } = req.body;

    const item = await Item.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }

    // Update fields
    if (name) item.name = name;
    if (value !== undefined) item.value = parseFloat(value);
    if (type) item.type = parseInt(type);
    if (category) item.category = category.toLowerCase();
    if (date) item.date = date;
    if (description !== undefined) item.description = description;
    if (paymentMethod) item.paymentMethod = paymentMethod;
    if (tags) item.tags = tags;

    await item.save();

    res.json({
      status: "success",
      message: "Item updated successfully",
      data: { item }
    });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Error updating item"
    });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete single item
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }

    res.json({
      status: "success",
      message: "Item deleted successfully",
      data: { item }
    });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting item"
    });
  }
});

// @route   DELETE /api/items
// @desc    Delete all items for user
// @access  Private
router.delete("/", async (req, res) => {
  try {
    const result = await Item.deleteMany({ user: req.userId });

    res.json({
      status: "success",
      message: "All items deleted successfully",
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error("Delete all items error:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting items"
    });
  }
});

module.exports = router;

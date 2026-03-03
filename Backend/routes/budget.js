const express = require("express");
const Budget = require("../models/Budget");
const Item = require("../models/Item");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/budget
// @desc    Get all budgets for user
// @access  Private
router.get("/", async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.userId })
      .sort({ year: -1, month: -1 });

    res.json({
      status: "success",
      results: budgets.length,
      data: { budgets }
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching budgets"
    });
  }
});

// @route   GET /api/budget/current
// @desc    Get current month budget
// @access  Private
router.get("/current", async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let budget = await Budget.findOne({
      user: req.userId,
      month,
      year
    });

    if (!budget) {
      return res.status(404).json({
        status: "error",
        message: "No budget set for current month"
      });
    }

    // Calculate actual spending for each category
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const actualSpending = await Item.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 1, // Expenses only
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$category",
          spent: { $sum: "$value" }
        }
      }
    ]);

    // Update spent amounts in budget
    budget.categoryBudgets.forEach(catBudget => {
      const actual = actualSpending.find(a => a._id === catBudget.category);
      catBudget.spent = actual ? actual.spent : 0;
    });

    await budget.save();

    const utilization = budget.getUtilizationPercentage();
    const isExceeded = budget.isBudgetExceeded();

    res.json({
      status: "success",
      data: {
        budget,
        utilization: utilization.toFixed(2),
        isExceeded,
        remaining: budget.totalBudget - budget.calculateTotalSpent()
      }
    });
  } catch (error) {
    console.error("Get current budget error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching current budget"
    });
  }
});

// @route   POST /api/budget
// @desc    Create new budget
// @access  Private
router.post("/", async (req, res) => {
  try {
    const { month, year, totalBudget, categoryBudgets, alerts, notes } = req.body;

    if (!month || !year || !totalBudget) {
      return res.status(400).json({
        status: "error",
        message: "Please provide month, year, and total budget"
      });
    }

    // Check if budget already exists
    const existing = await Budget.findOne({
      user: req.userId,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: "Budget already exists for this month"
      });
    }

    const budget = new Budget({
      user: req.userId,
      month: parseInt(month),
      year: parseInt(year),
      totalBudget: parseFloat(totalBudget),
      categoryBudgets: categoryBudgets || [],
      alerts,
      notes
    });

    await budget.save();

    res.status(201).json({
      status: "success",
      message: "Budget created successfully",
      data: { budget }
    });
  } catch (error) {
    console.error("Create budget error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Error creating budget"
    });
  }
});

// @route   PUT /api/budget/:id
// @desc    Update budget
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    const { totalBudget, categoryBudgets, alerts, notes } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!budget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found"
      });
    }

    if (totalBudget !== undefined) budget.totalBudget = parseFloat(totalBudget);
    if (categoryBudgets) budget.categoryBudgets = categoryBudgets;
    if (alerts) budget.alerts = { ...budget.alerts, ...alerts };
    if (notes !== undefined) budget.notes = notes;

    await budget.save();

    res.json({
      status: "success",
      message: "Budget updated successfully",
      data: { budget }
    });
  } catch (error) {
    console.error("Update budget error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Error updating budget"
    });
  }
});

// @route   DELETE /api/budget/:id
// @desc    Delete budget
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!budget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found"
      });
    }

    res.json({
      status: "success",
      message: "Budget deleted successfully"
    });
  } catch (error) {
    console.error("Delete budget error:", error);
    res.status(500).json({
      status: "error",
      message: "Error deleting budget"
    });
  }
});

module.exports = router;

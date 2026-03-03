const express = require("express");
const Item = require("../models/Item");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/analytics/summary
// @desc    Get financial summary
// @access  Private
router.get("/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = { user: req.user._id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Total income and expenses
    const summary = await Item.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$value" },
          count: { $sum: 1 }
        }
      }
    ]);

    const expenses = summary.find(s => s._id === 1) || { total: 0, count: 0 };
    const income = summary.find(s => s._id === 2) || { total: 0, count: 0 };

    res.json({
      status: "success",
      data: {
        totalIncome: income.total,
        totalExpenses: expenses.total,
        balance: income.total - expenses.total,
        savingsRate: income.total > 0 ? ((income.total - expenses.total) / income.total * 100).toFixed(2) : 0,
        transactionCount: {
          income: income.count,
          expenses: expenses.count,
          total: income.count + expenses.count
        }
      }
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({
      status: "error",
      message: "Error generating summary"
    });
  }
});

// @route   GET /api/analytics/category
// @desc    Get expenses by category
// @access  Private
router.get("/category", async (req, res) => {
  try {
    const { startDate, endDate, type = 1 } = req.query;

    const dateFilter = { user: req.user._id, type: parseInt(type) };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const categoryData = await Item.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$value" },
          count: { $sum: 1 },
          average: { $avg: "$value" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalAmount = categoryData.reduce((sum, cat) => sum + cat.total, 0);

    const formattedData = categoryData.map(cat => ({
      category: cat._id,
      total: cat.total,
      count: cat.count,
      average: cat.average.toFixed(2),
      percentage: totalAmount > 0 ? ((cat.total / totalAmount) * 100).toFixed(2) : 0
    }));

    res.json({
      status: "success",
      data: {
        categories: formattedData,
        totalAmount
      }
    });
  } catch (error) {
    console.error("Category analysis error:", error);
    res.status(500).json({
      status: "error",
      message: "Error analyzing categories"
    });
  }
});

// @route   GET /api/analytics/monthly
// @desc    Get monthly breakdown
// @access  Private
router.get("/monthly", async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyData = await Item.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type: "$type"
          },
          total: { $sum: "$value" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    // Format data by month
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i).toLocaleString("default", { month: "long" }),
      income: 0,
      expenses: 0,
      balance: 0,
      transactions: 0
    }));

    monthlyData.forEach(item => {
      const monthIndex = item._id.month - 1;
      if (item._id.type === 2) {
        months[monthIndex].income = item.total;
        months[monthIndex].transactions += item.count;
      } else {
        months[monthIndex].expenses = item.total;
        months[monthIndex].transactions += item.count;
      }
      months[monthIndex].balance = months[monthIndex].income - months[monthIndex].expenses;
    });

    res.json({
      status: "success",
      data: {
        year: parseInt(year),
        months
      }
    });
  } catch (error) {
    console.error("Monthly analysis error:", error);
    res.status(500).json({
      status: "error",
      message: "Error generating monthly report"
    });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get spending trends
// @access  Private
router.get("/trends", async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const dailyData = await Item.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            },
            type: "$type"
          },
          total: { $sum: "$value" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Group by date
    const trendMap = {};
    dailyData.forEach(item => {
      const date = item._id.date;
      if (!trendMap[date]) {
        trendMap[date] = { date, income: 0, expenses: 0, transactions: 0 };
      }
      if (item._id.type === 2) {
        trendMap[date].income = item.total;
      } else {
        trendMap[date].expenses = item.total;
      }
      trendMap[date].transactions += item.count;
    });

    const trends = Object.values(trendMap).map(day => ({
      ...day,
      netChange: day.income - day.expenses
    }));

    res.json({
      status: "success",
      data: {
        period: `${days} days`,
        trends
      }
    });
  } catch (error) {
    console.error("Trends error:", error);
    res.status(500).json({
      status: "error",
      message: "Error generating trends"
    });
  }
});

// @route   GET /api/analytics/top-expenses
// @desc    Get top expenses
// @access  Private
router.get("/top-expenses", async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const dateFilter = { user: req.user._id, type: 1 };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const topExpenses = await Item.find(dateFilter)
      .sort({ value: -1 })
      .limit(parseInt(limit))
      .select("name value category date");

    res.json({
      status: "success",
      data: { topExpenses }
    });
  } catch (error) {
    console.error("Top expenses error:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching top expenses"
    });
  }
});

module.exports = router;

const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0
    },
    categoryBudgets: [
      {
        category: {
          type: String,
          required: true,
          enum: [
            "housing",
            "transport",
            "food",
            "healthcare",
            "shopping",
            "entertainment",
            "education",
            "utilities",
            "others"
          ]
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        spent: {
          type: Number,
          default: 0
        }
      }
    ],
    alerts: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 80, // Alert when 80% of budget is used
        min: 0,
        max: 100
      }
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"]
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one budget per user per month/year
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

// Method to calculate total spent
budgetSchema.methods.calculateTotalSpent = function () {
  return this.categoryBudgets.reduce((total, cat) => total + cat.spent, 0);
};

// Method to check if budget exceeded
budgetSchema.methods.isBudgetExceeded = function () {
  return this.calculateTotalSpent() > this.totalBudget;
};

// Method to get budget utilization percentage
budgetSchema.methods.getUtilizationPercentage = function () {
  const spent = this.calculateTotalSpent();
  return this.totalBudget > 0 ? (spent / this.totalBudget) * 100 : 0;
};

module.exports = mongoose.model("Budget", budgetSchema);

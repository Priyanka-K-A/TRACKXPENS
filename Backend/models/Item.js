const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: [true, "Transaction name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    value: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"]
    },
    type: {
      type: Number,
      required: true,
      enum: [1, 2], // 1 = Expense, 2 = Income
      default: 1
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      lowercase: true,
      enum: [
        "salary",
        "housing",
        "transport",
        "food",
        "healthcare",
        "shopping",
        "entertainment",
        "education",
        "utilities",
        "investment",
        "others"
      ]
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "other"],
      default: "cash"
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: null
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
itemSchema.index({ user: 1, date: -1 });
itemSchema.index({ user: 1, type: 1 });
itemSchema.index({ user: 1, category: 1 });

// Virtual for formatted date
itemSchema.virtual("formattedDate").get(function () {
  return this.date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
});

// Method to check if item is expense
itemSchema.methods.isExpense = function () {
  return this.type === 1;
};

// Method to check if item is income
itemSchema.methods.isIncome = function () {
  return this.type === 2;
};

module.exports = mongoose.model("Item", itemSchema);

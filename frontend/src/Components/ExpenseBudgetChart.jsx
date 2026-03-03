import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { Empty, Progress } from "antd";
import {
  BarChartOutlined, PieChartOutlined, LineChartOutlined,
  TrophyOutlined, RiseOutlined, ArrowUpOutlined, ArrowDownOutlined
} from "@ant-design/icons";
import "./ExpenseBudgetChart.scss";

const categoriesList = [
  "Salary", "Housing", "Transport", "Food",
  "Healthcare", "Shopping", "Entertainment",
  "Education", "Utilities", "Others"
];

const categoryColors = {
  Salary:        "#00d4a4",
  Housing:       "#f59e0b",
  Transport:     "#4e9eff",
  Food:          "#ff5c7c",
  Healthcare:    "#a78bfa",
  Shopping:      "#f97316",
  Entertainment: "#06b6d4",
  Education:     "#6366f1",
  Utilities:     "#64748b",
  Others:        "#475569",
};

const categoryEmojis = {
  Salary:        "💰",
  Housing:       "🏠",
  Transport:     "🚗",
  Food:          "🍔",
  Healthcare:    "🏥",
  Shopping:      "🛍️",
  Entertainment: "🎬",
  Education:     "📚",
  Utilities:     "⚡",
  Others:        "📦",
};

const aggregateByCategory = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  return categoriesList
    .map((category) => ({
      name: category,
      short: category.slice(0, 4),
      emoji: categoryEmojis[category],
      Total: items
        .filter((item) =>
          item.category?.trim().toLowerCase() === category.trim().toLowerCase()
        )
        .reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0),
      color: categoryColors[category],
    }))
    .filter((cat) => cat.Total > 0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          ₹{payload[0].value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ExpenseBudgetChart = ({ items = [] }) => {
  const [chartType, setChartType] = useState("bar");

  if (!Array.isArray(items)) {
    return <div className="chart-container"><p>Error: Invalid data</p></div>;
  }

  const chartData = aggregateByCategory(items);
  const totalAmount = chartData.reduce((sum, item) => sum + item.Total, 0);
  const topCategories = [...chartData].sort((a, b) => b.Total - a.Total).slice(0, 3);

  // Stats
  const incomeItems = items.filter(i => i.type === 2);
  const expenseItems = items.filter(i => i.type === 1);
  const totalIncome = incomeItems.reduce((s, i) => s + parseFloat(i.value || 0), 0);
  const totalExpense = expenseItems.reduce((s, i) => s + parseFloat(i.value || 0), 0);
  const incomePercent = totalIncome + totalExpense > 0
    ? ((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(0)
    : 0;

  if (chartData.length === 0) {
    return (
      <div className="chart-container empty-state">
        <div className="chart-top-header">
          <div>
            <h2 className="chart-heading">Analytics</h2>
            <p className="chart-subheading">Category breakdown</p>
          </div>
        </div>
        <div className="chart-empty-body">
          <div className="empty-icon">📊</div>
          <p className="empty-title">No data yet</p>
          <p className="empty-desc">Add transactions to see visual analytics and breakdowns</p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }} barSize={28}>
              <defs>
                {chartData.map((entry, i) => (
                  <linearGradient key={i} id={`bg-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#555e77', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-40}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: '#555e77', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.06)' }} />
              <Bar dataKey="Total" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={`url(#bg-${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <defs>
                {chartData.map((entry, i) => (
                  <linearGradient key={i} id={`pg-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={90}
                innerRadius={40}
                dataKey="Total"
                strokeWidth={1.5}
                stroke="rgba(255,255,255,0.05)"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={`url(#pg-${i})`} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#8b92a8', fontSize: '11px' }}>{value}</span>
                )}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6c63ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#f0f1f2', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-40}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: '#d9dce6', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Total"
                stroke="#6c63ff"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      key={payload.name}
                      cx={cx} cy={cy} r={4}
                      fill={payload.color}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chart-container">
      {/* Header */}
      <div className="chart-top-header">
        <div>
          <h2 className="chart-heading">Analytics</h2>
          <p className="chart-subheading">Spending by category</p>
        </div>
        <div className="chart-toggle">
          <button
            className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title="Bar Chart"
          >
            <BarChartOutlined />
          </button>
          <button
            className={`toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title="Pie Chart"
          >
            <PieChartOutlined />
          </button>
          <button
            className={`toggle-btn ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
            title="Area Chart"
          >
            <LineChartOutlined />
          </button>
        </div>
      </div>

      {/* Mini stats */}
      <div className="chart-mini-stats">
        <div className="mini-stat">
          <ArrowDownOutlined style={{ color: '#00d4a4' }} />
          <div>
            <span className="ms-label">Income</span>
            <span className="ms-value income">₹{totalIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="mini-stat-divider"></div>
        <div className="mini-stat">
          <ArrowUpOutlined style={{ color: '#ff5c7c' }} />
          <div>
            <span className="ms-label">Expense</span>
            <span className="ms-value expense">₹{totalExpense.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="mini-ratio">
          <div className="ratio-bar">
            <div
              className="ratio-income"
              style={{ width: `${incomePercent}%` }}
            ></div>
          </div>
          <span className="ratio-label">{incomePercent}% income</span>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-wrapper">
        {renderChart()}
      </div>

      {/* Divider */}
      <div className="chart-divider"></div>

      {/* Top categories */}
      <div className="top-section">
        <div className="top-section-header">
          <TrophyOutlined style={{ color: '#f59e0b' }} />
          <span>Top Spending</span>
        </div>
        <div className="top-list">
          {topCategories.map((cat, i) => {
            const pct = ((cat.Total / totalAmount) * 100).toFixed(1);
            return (
              <div key={cat.name} className="top-item">
                {/* <div className="top-rank" style={{ color: ['#f59e0b','#94a3b8','#b45309'][i] }}>
                  {['🥇','🥈','🥉'][i]}
                </div> */}
                <div className="top-emoji">{cat.emoji}</div>
                <div className="top-body">
                  <div className="top-row">
                    <span className="top-name">{cat.name}</span>
                    <span className="top-val" style={{ color: cat.color }}>
                      ₹{cat.Total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="top-bar-track">
                    <div
                      className="top-bar-fill"
                      style={{ width: `${pct}%`, background: cat.color }}
                    ></div>
                  </div>
                  <span className="top-pct">{pct}% of total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="chart-footer">
        <div className="footer-stat">
          <span className="fs-label">Total Tracked</span>
          <span className="fs-value">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="footer-stat">
          <span className="fs-label">Categories</span>
          <span className="fs-value">{chartData.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ExpenseBudgetChart;
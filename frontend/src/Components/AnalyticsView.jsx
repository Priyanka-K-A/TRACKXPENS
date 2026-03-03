import React from 'react';
import {
  WalletOutlined, ArrowUpOutlined, ArrowDownOutlined,
  RiseOutlined, FallOutlined, FilterOutlined
} from '@ant-design/icons';
import ExpenseBudgetChart from './ExpenseBudgetChart';

// ─── Component ────────────────────────────────────────────────────────────────
const AnalyticsView = ({
  items,     // full unfiltered items array
  summary,   // { balance, totalIncome, totalExpenses }
}) => {

  const savingsRate = summary.totalIncome > 0
    ? (((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100).toFixed(1)
    : 0;

  return (
    <div className="panel-body">

      {/* ── KPI Cards ── */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>

        <div className="kpi-card kpi-balance">
          <div className="kpi-header">
            <span className="kpi-label">Total Balance</span>
            <div className="kpi-icon-wrap balance-icon">
              <WalletOutlined />
            </div>
          </div>
          <div className="kpi-value">₹{summary.balance?.toLocaleString() || 0}</div>
          <div className="kpi-footer">
            <RiseOutlined className="kpi-trend-icon positive" />
            <span className="kpi-trend-text">Savings rate: {savingsRate}%</span>
          </div>
          <div className="kpi-bg-shape"></div>
        </div>

        <div className="kpi-card kpi-income">
          <div className="kpi-header">
            <span className="kpi-label">Total Income</span>
            <div className="kpi-icon-wrap income-icon">
              <ArrowDownOutlined />
            </div>
          </div>
          <div className="kpi-value">₹{summary.totalIncome?.toLocaleString() || 0}</div>
          <div className="kpi-footer">
            <RiseOutlined className="kpi-trend-icon positive" />
            <span className="kpi-trend-text">
              {items.filter(i => i.type === 2).length} income entries
            </span>
          </div>
          <div className="kpi-bg-shape"></div>
        </div>

        <div className="kpi-card kpi-expense">
          <div className="kpi-header">
            <span className="kpi-label">Total Expenses</span>
            <div className="kpi-icon-wrap expense-icon">
              <ArrowUpOutlined />
            </div>
          </div>
          <div className="kpi-value">₹{summary.totalExpenses?.toLocaleString() || 0}</div>
          <div className="kpi-footer">
            <FallOutlined className="kpi-trend-icon negative" />
            <span className="kpi-trend-text">
              {items.filter(i => i.type === 1).length} expense entries
            </span>
          </div>
          <div className="kpi-bg-shape"></div>
        </div>

        <div className="kpi-card kpi-transactions">
          <div className="kpi-header">
            <span className="kpi-label">Transactions</span>
            <div className="kpi-icon-wrap tx-icon">
              <FilterOutlined />
            </div>
          </div>
          <div className="kpi-value">{items.length}</div>
          <div className="kpi-footer">
            <span className="kpi-trend-text">{items.length} total records</span>
          </div>
          <div className="kpi-bg-shape"></div>
        </div>

      </div>

      {/* ── Full-width Chart ── */}
      <div className="chart-panel" style={{ borderRadius: '18px' }}>
        <ExpenseBudgetChart items={items} />
      </div>

    </div>
  );
};

export default AnalyticsView;
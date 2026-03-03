import React, { useEffect, useState } from 'react';
import {
  Button, Modal, Form, Input, Radio, Select, Card, DatePicker,
  Space, notification, Row, Col, Spin, Empty,
  Dropdown, Menu, Avatar, Badge, Tabs, Tooltip
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ExportOutlined,
  LogoutOutlined, UserOutlined, SettingOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
  WalletOutlined, RiseOutlined, FallOutlined,
  FilterOutlined, CalendarOutlined, BellOutlined,
  SearchOutlined, SyncOutlined, DashboardOutlined
} from '@ant-design/icons';
import { GiHouse, GiForkKnifeSpoon, GiCash } from "react-icons/gi";
import { FaMotorcycle, FaHospitalUser, FaShoppingCart } from "react-icons/fa";
import { BsFillStarFill } from "react-icons/bs";
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import { MdOutlineAccountBalance } from "react-icons/md";
import moment from 'moment';
import './expenseTracker.scss';
import ExpenseBudgetChart from './ExpenseBudgetChart';
import TransactionsView from './TransactionsView';
import AnalyticsView from './AnalyticsView';
import { itemsAPI, analyticsAPI } from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const ExpenseTracker = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [value, setValue] = useState(1);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [form] = Form.useForm();
  const [greeting, setGreeting] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('dashboard');

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });

  const [dateRange, setDateRange] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    getCurrentGreeting();
    fetchItems();
    fetchSummary();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, dateRange, categoryFilter, typeFilter, searchQuery]);

  const getCurrentGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 12) setGreeting('Good Morning');
    else if (currentHour >= 12 && currentHour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const fetchItems = async () => {
    try {
      setPageLoading(true);
      const response = await itemsAPI.getAll();
      const fetchedItems = response.data.data.items || [];
      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      notification.error({
        message: "Failed to fetch transactions",
        description: error.response?.data?.message || "Please try again"
      });
    } finally {
      setPageLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await analyticsAPI.getSummary();
      setSummary(response.data.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (Array.isArray(dateRange) && dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const itemDate = moment(item.date);
        return itemDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      });
    }

    if (categoryFilter) {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(item => item.type === parseInt(typeFilter));
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const showModal = () => {
    setOpen(true);
    setEditMode(false);
    setSelectedDate(moment());
    form.resetFields();
  };

  const showEditModal = (item) => {
    setOpen(true);
    setEditMode(true);
    setEditItemId(item._id);
    setValue(item.type);
    setSelectedDate(moment(item.date));
    form.setFieldsValue({
      name: item.name,
      value: item.value,
      category: item.category,
      description: item.description
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const amount = parseFloat(values.value);
      if (isNaN(amount) || amount <= 0) {
        notification.error({ message: 'Invalid Amount' });
        setLoading(false);
        return;
      }

      const itemData = {
        name: values.name,
        value: amount,
        type: Number(value),
        date: selectedDate.format("YYYY-MM-DD"),
        category: values.category,
        description: values.description
      };

      if (!editMode && itemData.type === 1) {
        const currentBalance = summary.balance;
        if (itemData.value > currentBalance) {
          notification.error({
            message: "Insufficient Balance",
            description: `Expense (₹${itemData.value}) cannot exceed your balance (₹${currentBalance})`,
          });
          setLoading(false);
          return;
        }
      }

      if (editMode) {
        await itemsAPI.update(editItemId, itemData);
        notification.success({ message: "Transaction updated successfully" });
      } else {
        await itemsAPI.create(itemData);
        notification.success({
          message: itemData.type === 2 ? "Income Added" : "Expense Added",
        });
      }

      setOpen(false);
      form.resetFields();
      fetchItems();
      fetchSummary();
    } catch (error) {
      console.error("Error saving item:", error);
      notification.error({
        message: "Failed to save transaction",
        description: error.response?.data?.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setEditMode(false);
    setEditItemId(null);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Delete Transaction",
      content: "Are you sure you want to delete this transaction?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await itemsAPI.delete(id);
          notification.success({ message: "Deleted Successfully" });
          fetchItems();
          fetchSummary();
        } catch (error) {
          notification.error({ message: "Failed to delete item" });
        }
      }
    });
  };

  const clearData = () => {
    Modal.confirm({
      title: "Clear All Data",
      content: "This will delete all transactions permanently. Are you sure?",
      okText: "Clear All",
      okType: "danger",
      onOk: async () => {
        try {
          await itemsAPI.deleteAll();
          setItems([]);
          setFilteredItems([]);
          setSummary({ totalIncome: 0, totalExpenses: 0, balance: 0 });
          notification.success({ message: "All data cleared successfully!" });
        } catch (error) {
          notification.error({ message: "Failed to clear data" });
        }
      }
    });
  };

  const exportData = () => {
    const csvContent = [
      ["Date", "Name", "Type", "Category", "Amount", "Description"],
      ...filteredItems.map(item => [
        moment(item.date).format("YYYY-MM-DD"),
        item.name,
        item.type === 1 ? "Expense" : "Income",
        item.category,
        item.value,
        item.description || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${moment().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    notification.success({ message: "Data exported successfully!" });
  };

  const categoryIcons = {
    salary: <GiCash />,
    housing: <GiHouse />,
    transport: <FaMotorcycle />,
    food: <GiForkKnifeSpoon />,
    healthcare: <FaHospitalUser />,
    shopping: <FaShoppingCart />,
  };

  const categoryColors = {
    salary: '#10b981',
    housing: '#f59e0b',
    transport: '#3b82f6',
    food: '#ef4444',
    healthcare: '#8b5cf6',
    shopping: '#ec4899',
    entertainment: '#06b6d4',
    education: '#6366f1',
    utilities: '#64748b',
    others: '#94a3b8',
  };

  const getCategoryIcon = (category) => categoryIcons[category] || <BsFillStarFill />;
  const getCategoryColor = (category) => categoryColors[category] || '#94a3b8';

  const getCategoryName = (category) => {
    const names = {
      salary: 'Salary', housing: 'Housing', transport: 'Transport',
      food: 'Food', healthcare: 'HealthCare', shopping: 'Shopping',
      entertainment: 'Entertainment', education: 'Education',
      utilities: 'Utilities'
    };
    return names[category] || 'Others';
  };

  const savingsRate = summary.totalIncome > 0
    ? (((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100).toFixed(1)
    : 0;

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>Profile</Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>Logout</Menu.Item>
    </Menu>
  );

  if (pageLoading) {
    return (
      <div className="page-loader">
        <div className="loader-content">
          <div className="logo-wrapper">
            <img
              src={require("../Assets/logo.png")}
              alt="TrackXpens"
              className="dashboard-logo"
            />
          </div>
          <div className="loader-text">TRACKXPENS</div>
          <div className="loader-spinner">
            <div className="spinner-ring"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-wrapper">
            <img
              src={require("../Assets/logo.png")}
              alt="TrackXpens"
              className="dashboard-logo"
            />
          </div>
          <span className="brand-name">TRACKXPENS</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <DashboardOutlined />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeView === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveView('transactions')}
          >
            <WalletOutlined />
            <span>Transactions</span>
          </button>
          <button
            className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveView('analytics')}
          >
            <RiseOutlined />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="sidebar-summary">
          <div className="sidebar-balance">
            <span className="sb-label">Net Balance</span>
            <span className="sb-value">₹{summary.balance?.toLocaleString() || 0}</span>
          </div>
          <div className="sidebar-bar">
            <div
              className="sidebar-bar-fill"
              style={{ width: `${Math.min((summary.balance / (summary.totalIncome || 1)) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="sidebar-meta">
            <span className="sb-savings">Savings Rate: {savingsRate}%</span>
          </div>
        </div>

        {/* <div className="sidebar-user">
          <Avatar size={36} icon={<UserOutlined />} className="sidebar-avatar" />
          <div className="sidebar-user-info">
            <span className="sidebar-username">{user?.username || 'User'}</span>
            <span className="sidebar-role">Personal Account</span>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>
            <LogoutOutlined />
          </button>
        </div> */}
      </aside>

      {/* Main Panel */}
      <main className="main-panel">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-greeting">
            <span className="greeting-tag">{greeting}</span>
            <h1 className="header-title">Welcome Back, {user?.username}!</h1>
            <p className="header-date">{moment().format('dddd, MMMM D, YYYY')}</p>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <SearchOutlined />
              <input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Tooltip title="Refresh">
              <button className="icon-btn" onClick={() => { fetchItems(); fetchSummary(); }}>
                <SyncOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Notifications">
              <button className="icon-btn notif-btn">
                <BellOutlined />
                <span className="notif-dot"></span>
              </button>
            </Tooltip>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div className="header-avatar">
                <Avatar size={38} icon={<UserOutlined />} />
              </div>
            </Dropdown>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <div className="panel-body">
            {/* KPI Cards */}
            <div className="kpi-grid">
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
                  <span className="kpi-trend-text">
                    {filteredItems.length} shown · {items.length} total
                  </span>
                </div>
                <div className="kpi-bg-shape"></div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="content-grid">
              {/* Left: Transactions */}
              <div className="transactions-panel">
                {/* Panel Header */}
                <div className="panel-header">
                  <div className="panel-title-group">
                    <h2 className="panel-title">Transactions</h2>
                    <span className="panel-count">{filteredItems.length} records</span>
                  </div>
                  <div className="panel-controls">
                    {/* <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={showModal}
                      className="btn-add-tx"
                    >
                      Add New
                    </Button> */}
                    <Button
                      icon={<ExportOutlined />}
                      onClick={exportData}
                      disabled={filteredItems.length === 0}
                      className="btn-export-tx"
                    >
                      Export
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={clearData}
                      className="btn-clear-tx"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="filter-row">
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder={["From", "To"]}
                    className="filter-range"
                    suffixIcon={<CalendarOutlined />}
                  />
                  <Select
                    placeholder="Category"
                    allowClear
                    onChange={setCategoryFilter}
                    className="filter-select"
                    style={{ minWidth: 150 }}
                  >
                    <Option value="salary">💰 Salary</Option>
                    <Option value="housing">🏠 Housing</Option>
                    <Option value="transport">🚗 Transport</Option>
                    <Option value="food">🍔 Food</Option>
                    <Option value="healthcare">🏥 Healthcare</Option>
                    <Option value="shopping">🛍️ Shopping</Option>
                    <Option value="entertainment">🎬 Entertainment</Option>
                    <Option value="education">📚 Education</Option>
                    <Option value="utilities">⚡ Utilities</Option>
                    <Option value="others">📦 Others</Option>
                  </Select>
                  <Select
                    placeholder="Type"
                    allowClear
                    onChange={setTypeFilter}
                    className="filter-select"
                    style={{ minWidth: 130 }}
                  >
                    <Option value="1">📉 Expense</Option>
                    <Option value="2">📈 Income</Option>
                  </Select>
                </div>

                {/* Transaction Columns */}
                {/* Transaction Columns */}
              <div className="tx-columns">

                {/* Income */}
                <div className="tx-col tx-income-col">
                  <div className="tx-col-header income-ch">
                    <div className="tx-col-label">
                      <ArrowDownOutlined />
                      <span>Income</span>
                    </div>
                    <span className="tx-col-badge income-badge">
                      {filteredItems.filter(i => i.type === 2).length}
                    </span>
                  </div>
                  <div className="tx-scroll">
                    {filteredItems.filter(item => item.type === 2).length === 0 ? (
                      <div className="tx-empty">
                        <Empty description="No income recorded" />
                      </div>
                    ) : (
                      <>
                        {filteredItems
                          .filter(item => item.type === 2)
                          .slice(0, 4)
                          .map((item) => {
                            const category = item.category?.toLowerCase() || "default";
                            return (
                              <div key={item._id} className="tx-card tx-card-income">
                                <div className="tx-icon-wrap" style={{ background: `${getCategoryColor(category)}20`, color: getCategoryColor(category) }}>
                                  {getCategoryIcon(category)}
                                </div>
                                <div className="tx-info">
                                  <span className="tx-name">{item.name}</span>
                                  <span className="tx-category">{getCategoryName(category)}</span>
                                  {item.description && <span className="tx-desc">{item.description}</span>}
                                </div>
                                <div className="tx-meta">
                                  <span className="tx-amount income-amount">+₹{item.value?.toLocaleString()}</span>
                                  <span className="tx-date">{moment(item.date).format("DD MMM")}</span>
                                  <div className="tx-actions">
                                    <button className="tx-btn edit-btn" onClick={() => showEditModal(item)}>
                                      <RiEdit2Line />
                                    </button>
                                    <button className="tx-btn del-btn" onClick={() => handleDelete(item._id)}>
                                      <RiDeleteBin6Line />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {filteredItems.filter(item => item.type === 2).length >= 5 && (
                          <button
                            className="show-all-btn"
                            onClick={() => setActiveView('transactions')}
                          >
                            Show all {filteredItems.filter(item => item.type === 2).length} income →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expense */}
                <div className="tx-col tx-expense-col">
                  <div className="tx-col-header expense-ch">
                    <div className="tx-col-label">
                      <ArrowUpOutlined />
                      <span>Expenses</span>
                    </div>
                    <span className="tx-col-badge expense-badge">
                      {filteredItems.filter(i => i.type === 1).length}
                    </span>
                  </div>
                  <div className="tx-scroll">
                    {filteredItems.filter(item => item.type === 1).length === 0 ? (
                      <div className="tx-empty">
                        <Empty description="No expenses recorded" />
                      </div>
                    ) : (
                      <>
                        {filteredItems
                          .filter(item => item.type === 1)
                          .slice(0, 4)
                          .map((item) => {
                            const category = item.category?.toLowerCase() || "default";
                            return (
                              <div key={item._id} className="tx-card tx-card-expense">
                                <div className="tx-icon-wrap" style={{ background: `${getCategoryColor(category)}20`, color: getCategoryColor(category) }}>
                                  {getCategoryIcon(category)}
                                </div>
                                <div className="tx-info">
                                  <span className="tx-name">{item.name}</span>
                                  <span className="tx-category">{getCategoryName(category)}</span>
                                  {item.description && <span className="tx-desc">{item.description}</span>}
                                </div>
                                <div className="tx-meta">
                                  <span className="tx-amount expense-amount">-₹{item.value?.toLocaleString()}</span>
                                  <span className="tx-date">{moment(item.date).format("DD MMM")}</span>
                                  <div className="tx-actions">
                                    <button className="tx-btn edit-btn" onClick={() => showEditModal(item)}>
                                      <RiEdit2Line />
                                    </button>
                                    <button className="tx-btn del-btn" onClick={() => handleDelete(item._id)}>
                                      <RiDeleteBin6Line />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {filteredItems.filter(item => item.type === 1).length >=5 && (
                          <button
                            className="show-all-btn"
                            onClick={() => setActiveView('transactions')}
                          >
                            Show all {filteredItems.filter(item => item.type === 1).length} expenses →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>
              </div>

              {/* Right: Chart */}
              <div className="chart-panel">
                <ExpenseBudgetChart items={filteredItems} />
              </div>
            </div>
          </div>
        )}

        {activeView === 'transactions' && (
          <TransactionsView
            filteredItems={filteredItems}
            dateRange={dateRange}
            setDateRange={setDateRange}
            setCategoryFilter={setCategoryFilter}
            setTypeFilter={setTypeFilter}
            summary={summary}
            onRefresh={() => { fetchItems(); fetchSummary(); }}
            exportData={exportData}
            clearData={clearData}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            items={items}
            summary={summary}
          />
        )}
      </main>

      {/* Modal */}
      {/* <Modal
        title={
          <div className="modal-title">
            <div className="modal-title-icon">
              {editMode ? <RiEdit2Line /> : <PlusOutlined />}
            </div>
            <span>{editMode ? "Edit Transaction" : "New Transaction"}</span>
          </div>
        }
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        className="tx-modal"
        width={480}
      >
        <Form form={form} layout="vertical" className="tx-form">
          <div className="form-row">
            <Form.Item
              label="Transaction Name"
              name="name"
              rules={[{ required: true, message: 'Please enter a name' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="e.g., Grocery Shopping" size="large" />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item
              label="Amount"
              name="value"
              rules={[{ required: true, message: 'Please enter an amount' }]}
              style={{ flex: 1 }}
            >
              <Input type="number" min={1} step={1} prefix="₹" size="large" placeholder="0.00" />
            </Form.Item>
          </div>

          <Form.Item
            label="Type"
            className="type-selector"
          >
            <Radio.Group
              onChange={(e) => setValue(e.target.value)}
              value={value}
              className="type-radio-group"
            >
              <Radio.Button value={1} className="type-radio expense-radio">
                <ArrowUpOutlined /> Expense
              </Radio.Button>
              <Radio.Button value={2} className="type-radio income-radio">
                <ArrowDownOutlined /> Income
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div className="form-row-2">
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category" size="large">
                <Option value="salary">💰 Salary</Option>
                <Option value="housing">🏠 Housing</Option>
                <Option value="transport">🚗 Transport</Option>
                <Option value="food">🍔 Food</Option>
                <Option value="healthcare">🏥 Healthcare</Option>
                <Option value="shopping">🛍️ Shopping</Option>
                <Option value="entertainment">🎬 Entertainment</Option>
                <Option value="education">📚 Education</Option>
                <Option value="utilities">⚡ Utilities</Option>
                <Option value="others">📦 Others</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Date">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Add a note (optional)" />
          </Form.Item>

          <div className="modal-footer">
            <Button onClick={handleCancel} size="large" className="modal-cancel-btn">
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleOk}
              size="large"
              className="modal-submit-btn"
            >
              {editMode ? "Update Transaction" : "Add Transaction"}
            </Button>
          </div>
        </Form>
      </Modal> */}
    </div>
  );
};

export default ExpenseTracker;
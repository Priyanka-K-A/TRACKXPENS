import React, { useState } from 'react';
import { Button, Select, DatePicker, Empty, Modal, Form, Input, Radio, notification } from 'antd';
import {
  PlusOutlined, DeleteOutlined, ExportOutlined,
  CalendarOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { GiHouse, GiForkKnifeSpoon, GiCash } from "react-icons/gi";
import { FaMotorcycle, FaHospitalUser, FaShoppingCart } from "react-icons/fa";
import { BsFillStarFill } from "react-icons/bs";
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import moment from 'moment';
import { itemsAPI } from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    entertainment: 'Entertainment', education: 'Education', utilities: 'Utilities',
  };
  return names[category] || 'Others';
};

// ─── Component ────────────────────────────────────────────────────────────────
const TransactionsView = ({
  filteredItems,   // already filtered array from ExpenseTracker
  dateRange,
  setDateRange,
  setCategoryFilter,
  setTypeFilter,
  summary,         // { balance, totalIncome, totalExpenses }
  onRefresh,       // call this after add / edit / delete to re-fetch
  exportData,      // export CSV handler from parent
  clearData,       // clear all handler from parent
}) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [txType, setTxType] = useState(1);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const showModal = () => {
    setOpen(true);
    setEditMode(false);
    setTxType(1);
    setSelectedDate(moment());
    form.resetFields();
  };

  const showEditModal = (item) => {
    setOpen(true);
    setEditMode(true);
    setEditItemId(item._id);
    setTxType(item.type);
    setSelectedDate(moment(item.date));
    form.setFieldsValue({
      name: item.name,
      value: item.value,
      category: item.category,
      description: item.description,
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
        type: Number(txType),
        date: selectedDate.format("YYYY-MM-DD"),
        category: values.category,
        description: values.description,
      };

      if (!editMode && itemData.type === 1 && itemData.value > summary.balance) {
        notification.error({
          message: "Insufficient Balance",
          description: `Expense (₹${itemData.value}) cannot exceed your balance (₹${summary.balance})`,
        });
        setLoading(false);
        return;
      }

      if (editMode) {
        await itemsAPI.update(editItemId, itemData);
        notification.success({ message: "Transaction updated successfully" });
      } else {
        await itemsAPI.create(itemData);
        notification.success({ message: itemData.type === 2 ? "Income Added" : "Expense Added" });
      }

      setOpen(false);
      form.resetFields();
      onRefresh();
    } catch (error) {
      notification.error({
        message: "Failed to save transaction",
        description: error.response?.data?.message,
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

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Transaction",
      content: "Are you sure you want to delete this transaction?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await itemsAPI.delete(id);
          notification.success({ message: "Deleted Successfully" });
          onRefresh();
        } catch (error) {
          notification.error({ message: "Failed to delete item" });
        }
      },
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="panel-body">
      <div className="transactions-panel" style={{ borderRadius: '18px' }}>

        {/* ── Panel Header ── */}
        <div className="panel-header">
          <div className="panel-title-group">
            <h2 className="panel-title">All Transactions</h2>
            <span className="panel-count">{filteredItems.length} records</span>
          </div>
          <div className="panel-controls">
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal} className="btn-add-tx">
              Add New
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={exportData}
              disabled={filteredItems.length === 0}
              className="btn-export-tx"
            >
              Export
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={clearData} className="btn-clear-tx">
              Clear
            </Button>
          </div>
        </div>

        {/* ── Filters ── */}
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

        {/* ── Transaction List ── */}
        <div className="tx-scroll" style={{ padding: '16px', maxHeight: '70vh' }}>
          {filteredItems.length === 0 ? (
            <div className="tx-empty">
              <Empty description="No transactions found" />
            </div>
          ) : (
            [...filteredItems]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((item) => {
                const category = item.category?.toLowerCase() || 'default';
                return (
                  <div
                    key={item._id}
                    className={`tx-card ${item.type === 2 ? 'tx-card-income' : 'tx-card-expense'}`}
                  >
                    <div
                      className="tx-icon-wrap"
                      style={{
                        background: `${getCategoryColor(category)}20`,
                        color: getCategoryColor(category),
                      }}
                    >
                      {getCategoryIcon(category)}
                    </div>

                    <div className="tx-info">
                      <span className="tx-name">{item.name}</span>
                      <span className="tx-category">{getCategoryName(category)}</span>
                      {item.description && <span className="tx-desc">{item.description}</span>}
                    </div>

                    <div className="tx-meta">
                      <span className={`tx-amount ${item.type === 2 ? 'income-amount' : 'expense-amount'}`}>
                        {item.type === 2 ? '+' : '-'}₹{item.value?.toLocaleString()}
                      </span>
                      <span className="tx-date">{moment(item.date).format('DD MMM YYYY')}</span>
                      <div className="tx-actions" style={{ opacity: 1 }}>
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
              })
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        title={
          <div className="modal-title">
            <div className="modal-title-icon">
              {editMode ? <RiEdit2Line /> : <PlusOutlined />}
            </div>
            <span>{editMode ? 'Edit Transaction' : 'New Transaction'}</span>
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

          <Form.Item label="Type" className="type-selector">
            <Radio.Group
              onChange={(e) => setTxType(e.target.value)}
              value={txType}
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
              {editMode ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionsView;
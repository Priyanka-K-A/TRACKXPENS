import React, { useState } from "react";
import { Form, Input, Button, Card, message, Typography, Progress } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  CheckCircleFilled,
  TrophyOutlined,
  LineChartOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import { authAPI } from "../services/api";
import "./signup.scss";

const { Title, Text } = Typography;

function Signup({ setPage }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getPasswordColor = () => {
    if (passwordStrength < 40) return "#ff4d4f";
    if (passwordStrength < 70) return "#faad14";
    return "#52c41a";
  };

  const handleSignup = async (values) => {
    setLoading(true);
    try {
      await authAPI.signup({
        username: values.username,
        email: values.email,
        password: values.password
      });

      message.success({
        content: "🎉 Welcome aboard! Redirecting to login...",
        duration: 2,
        style: { marginTop: '20vh' },
      });

      setTimeout(() => setPage("login"), 1500);
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="professional-signup">
      <div className="gradient-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>

        {/* Mild Circle Glassmorphism elements */}
        <div className="glass-circles">
          <div className="circle-glass circle-1"></div>
          <div className="circle-glass circle-2"></div>
          <div className="circle-glass circle-3"></div>
          <div className="circle-glass circle-4"></div>
          <div className="circle-glass circle-5"></div>
          <div className="circle-glass circle-6"></div>
          <div className="circle-glass circle-7"></div>
          <div className="circle-glass circle-8"></div>
        </div>
      </div>

      <div className="signup-wrapper">
        {/* LEFT SIDE - Branding */}
        <div className="branding-section">
          <div className="branding-content">
            <div className="logo-section">
              <div className="logo-image-wrapper">
                <img
                  src={require("../Assets/logo.png")}
                  alt="TrackXpens"
                  className="brand-logo-img"
                />
              </div>
              <Title level={1} className="brand-title">TRACKXPENS</Title>
              <Text className="brand-tagline">Smart Financial Management</Text>
            </div>

            <div className="features-showcase">

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">
                    <LineChartOutlined />
                  </div>
                  <Title level={5}>Real-time Analytics</Title>
                  <Text>Track your expenses with powerful insights</Text>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <SafetyOutlined />
                  </div>
                  <Title level={5}>Secure & Private</Title>
                  <Text>Your financial data is encrypted and protected</Text>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <TrophyOutlined />
                  </div>
                  <Title level={5}>Smart Budgeting</Title>
                  <Text>Set budgets and achieve your financial goals</Text>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Signup Form */}
        <div className="form-section">
          <Card className="signup-form-card" bordered={false}>
            <div className="form-header">
              <Title level={2} className="form-title">Create your account</Title>
              <Text className="form-subtitle">
                Join us and take control of your finances today
              </Text>
            </div>

            <Form
              form={form}
              name="signup"
              onFinish={handleSignup}
              layout="vertical"
              size="large"
              className="modern-form"
            >
              <Form.Item
                name="username"
                label={<span className="input-label">Username</span>}
                rules={[
                  { required: true, message: "Username is required" },
                  { min: 3, message: "At least 3 characters" },
                  { max: 30, message: "Maximum 30 characters" }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder="Enter your username"
                  className="premium-input"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="input-label">Email Address</span>}
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email format" }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="input-icon" />}
                  placeholder="you@example.com"
                  className="premium-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="input-label">Password</span>}
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 6, message: "At least 6 characters" }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Create a strong password"
                  className="premium-input"
                  onChange={handlePasswordChange}
                />
              </Form.Item>

              {passwordStrength > 0 && (
                <div className="password-strength">
                  <Progress
                    percent={passwordStrength}
                    strokeColor={getPasswordColor()}
                    showInfo={false}
                    strokeWidth={6}
                  />
                  <Text className="strength-text">
                    Password strength: {
                      passwordStrength < 40 ? "Weak" :
                        passwordStrength < 70 ? "Medium" : "Strong"
                    }
                  </Text>
                </div>
              )}

              <Form.Item
                name="confirmPassword"
                label={<span className="input-label">Confirm Password</span>}
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords don't match"));
                    }
                  })
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Confirm your password"
                  className="premium-input"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="premium-button"
                  icon={!loading && <CheckCircleFilled />}
                >
                  {loading ? "Creating your account..." : "Create Account"}
                </Button>
              </Form.Item>

              <div className="form-divider">
                <span>or</span>
              </div>

              <div className="alt-actions">
                <Text className="signin-text">
                  Already have an account?{" "}
                  <span
                    className="signin-link"
                    onClick={() => !loading && setPage("login")}
                  >
                    Sign in
                  </span>
                </Text>
              </div>

              <div className="terms-text">
                <Text type="secondary">
                  By signing up, you agree to our{" "}
                  <a href="#terms">Terms of Service</a> and{" "}
                  <a href="#privacy">Privacy Policy</a>
                </Text>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Signup;

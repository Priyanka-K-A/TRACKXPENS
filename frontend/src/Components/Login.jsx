import React, { useState } from "react";
import { Form, Input, Button, Card, message, Typography, Checkbox } from "antd";
import { 
  MailOutlined, 
  LockOutlined, 
  LoginOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { authAPI } from "../services/api";
import "./login.scss";

const { Title, Text } = Typography;

function Login({ setPage, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: values.email,
        password: values.password
      });

      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      message.success({
        content: `Welcome back, ${user.username}!`,
        duration: 3,
        style: { fontFamily: 'Arial, sans-serif', marginTop: '10vh', fontSize: '15px' },
      });

      onLogin(user);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="professional-login">
      {/* Animated Background */}
      <div className="gradient-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        
        {/* Circle Glassmorphism */}
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

      <div className="login-wrapper">
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
              <Text className="brand-tagline">Welcome Back to Smart Finance</Text>
            </div>

            <div className="features-showcase">
                           
              <div className="motivation-quote">
                <div className="quote-icon">💡</div>
                <Text className="quote-text">
                  "Beware of little expenses. A small leak will sink a great ship."
                </Text>
                <Text className="quote-author">- Benjamin Franklin</Text>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="form-section">
          <Card className="login-form-card" bordered={false}>
            <div className="form-header">
              <Title level={2} className="form-title">Welcome Back</Title>
              <Text className="form-subtitle">
                Sign in to access your account
              </Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              className="modern-form"
            >
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
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="input-label">Password</span>}
                rules={[
                  { required: true, message: "Password is required" }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Enter your password"
                  className="premium-input"
                  autoComplete="current-password"
                />
              </Form.Item>

              <div className="form-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="remember-checkbox">Remember me</Checkbox>
                </Form.Item>
                <a href="#forgot" className="forgot-link">Forgot password?</a>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="premium-button"
                  icon={!loading && <LoginOutlined />}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </Form.Item>

              <div className="form-divider">
                <span>or</span>
              </div>

              <div className="alt-actions">
                <Text className="signup-text">
                  Don't have an account?{" "}
                  <span 
                    className="signup-link" 
                    onClick={() => !loading && setPage("signup")}
                  >
                    Create account
                  </span>
                </Text>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Login;
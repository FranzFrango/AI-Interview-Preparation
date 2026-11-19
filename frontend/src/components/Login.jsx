import { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/accounts/login/",
        formData
      );

      localStorage.setItem(
        "access_token",
        response.data.access
      );

      localStorage.setItem(
        "refresh_token",
        response.data.refresh
      );

      alert("Login successful!");

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(
        "Login failed:",
        error.response?.data || error
      );

      alert(
        "Login failed. Please check your username and password."
      );
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}

      <div className="login-hero">

        <div className="brand">
          <div className="brand-icon">
            ✓
          </div>

          <span>AI Interviewer</span>
        </div>

        <div className="hero-content">

          <h1>
            Practice Smarter.
            <br />
            <span>Get Hired Faster.</span>
          </h1>

          <p>
            AI-powered interviews with personalized
            feedback to help you improve your skills
            and achieve your dream job.
          </p>

          <div className="feature-list">

            <div className="feature">
              <div className="feature-icon">
                🤖
              </div>

              <div>
                <h3>AI-Powered Interviews</h3>
                <p>
                  Realistic questions generated
                  based on your role and experience.
                </p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                📊
              </div>

              <div>
                <h3>Instant Feedback</h3>
                <p>
                  Get detailed feedback and scores
                  immediately after your interview.
                </p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                📈
              </div>

              <div>
                <h3>Track Your Progress</h3>
                <p>
                  Monitor your performance and keep
                  improving with every interview.
                </p>
              </div>
            </div>

          </div>

          {/* LAPTOP */}

          <div className="laptop-area">
            <div className="laptop">

              <div className="laptop-screen">

                <div className="screen-header">
                  <span>AI Interviewer</span>
                  <span>Dashboard</span>
                </div>

                <div className="screen-content">

                  <div className="screen-title">
                    Interview Dashboard
                  </div>

                  <div className="screen-cards">
                    <div>
                      <small>Interviews</small>
                      <strong>12</strong>
                    </div>

                    <div>
                      <small>Avg Score</small>
                      <strong>78%</strong>
                    </div>

                    <div>
                      <small>Progress</small>
                      <strong>85%</strong>
                    </div>
                  </div>

                  <div className="screen-chart">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

              </div>

              <div className="laptop-base">
                <div className="laptop-keyboard"></div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}

      <div className="login-section">

        <div className="login-card">

          <div className="user-icon">
            👤
          </div>

          <h2>Welcome Back</h2>

          <p className="login-subtitle">
            Login to your account to continue
          </p>

          <form onSubmit={handleSubmit}>

            <div className="login-field">
              <label>Username</label>

              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>

              <div className="password-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>
            </div>

            <div className="login-options">

              <label className="remember">
                <input
                  type="checkbox"
                />
                Remember me
              </label>

              <span className="forgot">
                Forgot password?
              </span>

            </div>

            <button
              type="submit"
              className="login-button"
            >
              Login
            </button>

          </form>

          

          <p className="register-text">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/register";
              }}
            >
              Register here
            </button>
          </p>

        </div>

        <div className="login-footer">

          <div>
            🔒
            <strong> Secure & Private</strong>
            <small>
              Your data is protected
            </small>
          </div>

          <div>
            ⚡
            <strong> 24/7 Access</strong>
            <small>
              Practice anytime
            </small>
          </div>

          <div>
            ⭐
            <strong> Trusted Platform</strong>
            <small>
              Built for interview preparation
            </small>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    target_role: "",
    experience_level: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/accounts/register/",
        formData
      );

      console.log(
        "Registration successful:",
        response.data
      );

      alert("Registration successful!");

      navigate("/login");

    } catch (error) {
      console.error(
        "Registration failed:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Registration failed. Please check your details."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        {/* HEADER */}

        <div className="register-header">

          <div className="register-logo">
            <span>✓</span>
          </div>

          <span className="register-eyebrow">
            AI INTERVIEWER
          </span>

          <h1>
            Create Account
          </h1>

          <p>
            Create your account and start preparing
            for your next interview.
          </p>

        </div>


        {/* ERROR */}

        {error && (
          <div className="register-error">
            {error}
          </div>
        )}


        {/* FORM */}

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >

          {/* NAME */}

          <div className="register-row">

            <div className="register-form-group">

              <label>
                First Name
              </label>

              <input
                type="text"
                name="first_name"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />

            </div>


            <div className="register-form-group">

              <label>
                Last Name
              </label>

              <input
                type="text"
                name="last_name"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* USERNAME */}

          <div className="register-form-group">

            <label>
              Username
            </label>

            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
            />

          </div>


          {/* EMAIL */}

          <div className="register-form-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="register-form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />

          </div>


          {/* TARGET ROLE */}

          <div className="register-form-group">

            <label>
              Target Job Role
            </label>

            <input
              type="text"
              name="target_role"
              placeholder="e.g. Python Developer"
              value={formData.target_role}
              onChange={handleChange}
              required
            />

          </div>


          {/* EXPERIENCE */}

          <div className="register-form-group">

            <label>
              Experience Level
            </label>

            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
              required
            >

              <option value="">
                Select your experience level
              </option>

              <option value="beginner">
                Beginner
              </option>

              <option value="intermediate">
                Intermediate
              </option>

              <option value="advanced">
                Advanced
              </option>

            </select>

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account →"}
          </button>

        </form>


        {/* LOGIN */}

        <div className="register-login">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>

        </div>

      </div>

    </div>
  );
}

export default Register;
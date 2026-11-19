import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("interview_id");

    navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* LOGO */}

      <Link to="/dashboard" className="navbar-logo">
        <span className="navbar-logo-icon">✓</span>
        <span>AI Interviewer</span>
      </Link>

      {/* NAVIGATION */}

      <div className="navbar-links">

        <Link
          to="/dashboard"
          className={
            location.pathname === "/dashboard"
              ? "nav-link active"
              : "nav-link"
          }
        >
          Dashboard
        </Link>

        <Link
          to="/interview/setup"
          className={
            location.pathname.startsWith("/interview")
              ? "nav-link active"
              : "nav-link"
          }
        >
          🎤 Interview
        </Link>

        <Link
          to="/resume"
          className={
            location.pathname === "/resume"
              ? "nav-link active"
              : "nav-link"
          }
        >
          📄 Resume
        </Link>
        <Link
          to="/resume-quiz"
          className={
            location.pathname === "/resume-quiz"
              ? "nav-link active"
              : "nav-link"
          }
        >
          🧠 Resume Quiz
        </Link>

        <Link
          to="/resume/history"
          className={
            location.pathname === "/resume/history"
              ? "nav-link active"
              : "nav-link"
          }
        >
          📋 History
        </Link>

        <button
          className="navbar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;
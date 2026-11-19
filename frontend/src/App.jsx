import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./auth/ProtectedRoute";

import InterviewSetup from "./components/InterviewSetup";
import Interview from "./components/Interview";
import InterviewResult from "./components/InterviewResult";
import ResumeQuiz from "./ResumeQuiz";
import ResumeAnalyzer from "./components/ResumeAnalyzer";
import ResumeHistory from "./components/ResumeHistory";

import Navbar from "./components/Navbar";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ========================= */}
        {/* PUBLIC PAGES */}
        {/* ========================= */}

        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ========================= */}
        {/* PROTECTED PAGES */}
        {/* ========================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Dashboard />
              </>
            </ProtectedRoute>
          }
        />


        <Route
          path="/interview/setup"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <InterviewSetup />
              </>
            </ProtectedRoute>
          }
        />


        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Interview />
              </>
            </ProtectedRoute>
          }
        />


        <Route
          path="/interview/result"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <InterviewResult />
              </>
            </ProtectedRoute>
          }
        />


        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <ResumeAnalyzer />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-quiz"
          element={
            <ProtectedRoute>
              <ResumeQuiz />
            </ProtectedRoute>
          }
        />


        <Route
          path="/resume/history"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <ResumeHistory />
              </>
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
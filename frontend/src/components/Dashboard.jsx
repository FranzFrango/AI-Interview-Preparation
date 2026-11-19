import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [resumeQuizResults, setResumeQuizResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  // =========================
  // FETCH DASHBOARD DATA
  // =========================

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      // GET PROFILE
      try {
        const profileResponse = await api.get(
          "/accounts/profile/"
        );

        setProfile(profileResponse.data);
      } catch (error) {
        console.error(
          "PROFILE ERROR:",
          error.response?.status,
          error.response?.data
        );

        setError("Unable to load profile.");
        return;
      }

      // GET INTERVIEW HISTORY
      try {
        const interviewResponse = await api.get(
          "/interviews/history/"
        );

        setInterviews(interviewResponse.data);
      } catch (error) {
        console.error(
          "INTERVIEW HISTORY ERROR:",
          error.response?.status,
          error.response?.data
        );

        setInterviews([]);
      }

      // GET RESUME QUIZ RESULTS
      try {
        const resumeQuizResponse = await api.get(
          "/interviews/resume-quiz/results/"
        );

        setResumeQuizResults(resumeQuizResponse.data);
      } catch (error) {
        console.error(
          "RESUME QUIZ RESULTS ERROR:",
          error.response?.status,
          error.response?.data
        );

        setResumeQuizResults([]);
      }
    };

    fetchDashboard();
  }, [navigate]);

  // =========================
  // LOADING / ERROR
  // =========================

  if (error) {
    return (
      <div className="dashboard-message">
        <div className="message-card">

          <div className="message-icon">
            !
          </div>

          <h2>
            {error}
          </h2>

          <button
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>

        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-message">
        <div className="message-card">

          <div className="loading-spinner"></div>

          <h2>
            Loading Dashboard...
          </h2>

          <p>
            Preparing your interview statistics.
          </p>

        </div>
      </div>
    );
  }

  // =========================
  // STATISTICS
  // =========================

  const completedInterviews = interviews.filter(
    (interview) => interview.has_result
  );

  const filteredInterviews = interviews.filter(
    (interview) => {
      const matchesSearch =
        interview.job_role
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "completed" &&
          interview.has_result) ||
        (filter === "not_evaluated" &&
          !interview.has_result);

      return matchesSearch && matchesFilter;
    }
  );

  const totalInterviews =
    interviews.length;

  const completedCount =
    completedInterviews.length;

  const averageScore =
    completedCount > 0
      ? Math.round(
          completedInterviews.reduce(
            (total, interview) =>
              total +
              Number(interview.score || 0),
            0
          ) / completedCount
        )
      : 0;

  const highestScore =
    completedCount > 0
      ? Math.max(
          ...completedInterviews.map(
            (interview) =>
              Number(interview.score || 0)
          )
        )
      : 0;

  // =========================
  // COMPLETION RATE
  // =========================

  const completionRate =
    totalInterviews > 0
      ? Math.round(
          (completedCount / totalInterviews) *
            100
        )
      : 0;

  // =========================
  // CHART DATA
  // =========================

  const chartData = completedInterviews
    .slice()
    .reverse()
    .map((interview, index) => ({
      name: `Interview ${index + 1}`,
      score: Number(interview.score || 0),
    }));

  // =========================
  // LATEST / PREVIOUS SCORE
  // =========================

  const latestScore =
    completedCount > 0
      ? Number(
          completedInterviews[
            completedInterviews.length - 1
          ].score || 0
        )
      : 0;

  const previousScore =
    completedCount > 1
      ? Number(
          completedInterviews[
            completedInterviews.length - 2
          ].score || 0
        )
      : null;

  const improvement =
    previousScore !== null
      ? latestScore - previousScore
      : null;

  // =========================
  // RESUME QUIZ STATISTICS
  // =========================

  const resumeQuizCount =
    resumeQuizResults.length;

  const resumeQuizAverage =
    resumeQuizCount > 0
      ? Math.round(
          resumeQuizResults.reduce(
            (total, quiz) =>
              total +
              Number(quiz.score || 0),
            0
          ) / resumeQuizCount
        )
      : 0;

  const latestResumeQuizScore =
    resumeQuizCount > 0
      ? Number(
          resumeQuizResults[0].score || 0
        )
      : 0;

  const highestResumeQuizScore =
    resumeQuizCount > 0
      ? Math.max(
          ...resumeQuizResults.map(
            (quiz) =>
              Number(quiz.score || 0)
          )
        )
      : 0;

  // =========================
  // DELETE INTERVIEW
  // =========================

  const handleDeleteInterview = async (
    interviewId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this interview?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/interviews/${interviewId}/delete/`
      );

      setInterviews((currentInterviews) =>
        currentInterviews.filter(
          (item) => item.id !== interviewId
        )
      );
    } catch (error) {
      console.error(
        "Delete interview failed:",
        error.response?.data || error
      );

      alert(
        "Unable to delete interview."
      );
    }
  };

  // =========================
  // VIEW RESULT
  // =========================

  const handleViewResult = (
    interviewId
  ) => {
    localStorage.setItem(
      "interview_id",
      interviewId
    );

    navigate("/interview/result");
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem(
      "interview_id"
    );

    navigate("/login");
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="dashboard">

      <div className="dashboard-container">

        {/* ========================= */}
        {/* WELCOME */}
        {/* ========================= */}

        <section className="dashboard-welcome">

          <div className="welcome-icon">
            ✓
          </div>

          <h1>
            Dashboard
          </h1>

          <p>
            Track your interview preparation
            progress and improve your skills
            with AI.
          </p>

        </section>


        {/* ========================= */}
        {/* PROFILE */}
        {/* ========================= */}

        <section className="profile-card">

          <div className="section-heading">

            <div className="section-icon">
              👤
            </div>

            <div>

              <h2>
                Welcome, {profile.username}!
              </h2>

              <p>
                Your account information
              </p>

            </div>

          </div>

          <div className="profile-grid">

            <div className="profile-item">

              <span className="profile-label">
                EMAIL
              </span>

              <span className="profile-value">
                {profile.email || "Not available"}
              </span>

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* STATISTICS */}
        {/* ========================= */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              🎤
            </div>

            <div>

              <span className="stat-label">
                TOTAL INTERVIEWS
              </span>

              <h3>
                {totalInterviews}
              </h3>

              <p>
                Practice sessions
              </p>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              ✓
            </div>

            <div>

              <span className="stat-label">
                COMPLETED
              </span>

              <h3>
                {completedCount}
              </h3>

              <p>
                Evaluated interviews
              </p>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              📊
            </div>

            <div>

              <span className="stat-label">
                AVERAGE SCORE
              </span>

              <h3>
                {averageScore}
                <small>/100</small>
              </h3>

              <p>
                Overall performance
              </p>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🏆
            </div>

            <div>

              <span className="stat-label">
                HIGHEST SCORE
              </span>

              <h3>
                {highestScore}
                <small>/100</small>
              </h3>

              <p>
                Personal best
              </p>

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* PERFORMANCE */}
        {/* ========================= */}

        <section className="analytics-card">

          <div className="analytics-header">

            <div>

              <span className="section-eyebrow">
                PERFORMANCE
              </span>

              <h2>
                Performance Overview
              </h2>

              <p>
                Track your interview scores
                over time.
              </p>

            </div>

            <div className="analytics-average">

              <span>
                Average Score
              </span>

              <strong>
                {averageScore}/100
              </strong>

            </div>

          </div>


          {chartData.length === 0 ? (

            <div className="chart-empty">

              <div className="empty-chart-icon">
                📈
              </div>

              <h3>
                No performance data yet
              </h3>

              <p>
                Complete an interview to see
                your performance chart.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/interview/setup"
                  )
                }
              >
                Start Your First Interview
              </button>

            </div>

          ) : (

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </section>


        {/* ========================= */}
        {/* RESUME QUIZ PERFORMANCE */}
        {/* ========================= */}

        <section className="resume-quiz-dashboard-card">

          <div className="resume-quiz-header">

            <span className="section-eyebrow">
              RESUME QUIZ
            </span>

            <h2>
              Track your performance on resume-based quizzes.
            </h2>

          </div>


          {/* QUIZ STATISTICS */}

          <div className="resume-quiz-stats-grid">

            <div className="resume-quiz-stat">

              <span>
                QUIZZES TAKEN
              </span>

              <strong>
                {resumeQuizCount}
              </strong>

              <p>
                Completed quizzes
              </p>

            </div>


            <div className="resume-quiz-stat">

              <span>
                AVERAGE SCORE
              </span>

              <strong>
                {resumeQuizAverage}
                <small>/100</small>
              </strong>

              <p>
                Overall quiz performance
              </p>

            </div>


            <div className="resume-quiz-stat">

              <span>
                HIGHEST SCORE
              </span>

              <strong>
                {highestResumeQuizScore}
                <small>/100</small>
              </strong>

              <p>
                Personal best
              </p>

            </div>


            <div className="resume-quiz-stat">

              <span>
                LATEST SCORE
              </span>

              <strong>
                {latestResumeQuizScore}
                <small>/100</small>
              </strong>

              <p>
                Most recent quiz
              </p>

            </div>

          </div>


          {/* RECENT QUIZZES */}

          {resumeQuizResults.length > 0 && (

            <div className="resume-quiz-history">

              <h3>
                Recent Resume Quizzes
              </h3>


              {resumeQuizResults
                .slice(0, 5)
                .map((quiz) => (

                  <div
                    className="resume-quiz-history-item"
                    key={quiz.id}
                  >

                    <div className="resume-quiz-history-info">

                      <strong>
                        Resume Quiz
                      </strong>

                      <span>
                        {quiz.total_questions} Questions
                      </span>

                    </div>


                    <div className="resume-quiz-history-score">

                      <strong>
                        {quiz.score}/100
                      </strong>

                      <span>
                        {new Date(
                          quiz.created_at
                        ).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </section>


        {/* ========================= */}
        {/* PROGRESS */}
        {/* ========================= */}

        <section className="progress-card">

          <div className="progress-heading">

            <div>

              <span className="section-eyebrow">
                YOUR PROGRESS
              </span>

              <h2>
                Interview Progress
              </h2>

            </div>

            <div className="progress-score">
              {latestScore}/100
            </div>

          </div>


          <div className="progress-details">

            <div>

              <span>
                Latest Score
              </span>

              <strong>
                {latestScore}/100
              </strong>

            </div>


            <div>

              <span>
                Previous Score
              </span>

              <strong>
                {previousScore !== null
                  ? `${previousScore}/100`
                  : "N/A"}
              </strong>

            </div>


            <div>

              <span>
                Improvement
              </span>

              <strong>
                {improvement !== null
                  ? `${
                      improvement >= 0
                        ? "+"
                        : ""
                    }${improvement} points`
                  : "N/A"}
              </strong>

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* RECOMMENDATION */}
        {/* ========================= */}

        <section className="recommendation-card">

          <div className="recommendation-icon">
            💡
          </div>

          <div className="recommendation-content">

            <span className="section-eyebrow">
              AI GUIDANCE
            </span>

            <h2>
              Practice Recommendation
            </h2>


            {completedCount === 0 ? (

              <p>
                Complete your first interview
                to receive personalized practice
                recommendations.
              </p>

            ) : averageScore < 50 ? (

              <>
                <p>
                  Your average score is{" "}
                  <strong>
                    {averageScore}/100
                  </strong>.
                </p>

                <p>
                  <strong>
                    Recommendation:
                  </strong>{" "}
                  Focus on technical correctness
                  and completeness. Explain your
                  answers with specific examples
                  and practical details.
                </p>
              </>

            ) : averageScore < 75 ? (

              <>
                <p>
                  Your average score is{" "}
                  <strong>
                    {averageScore}/100
                  </strong>.
                </p>

                <p>
                  <strong>
                    Recommendation:
                  </strong>{" "}
                  Practice giving more detailed
                  answers and include practical
                  examples.
                </p>
              </>

            ) : (

              <>
                <p>
                  Your average score is{" "}
                  <strong>
                    {averageScore}/100
                  </strong>.
                </p>

                <p>
                  <strong>
                    Recommendation:
                  </strong>{" "}
                  Great progress! Practice
                  advanced questions and focus
                  on explaining your reasoning
                  clearly.
                </p>
              </>

            )}

          </div>

        </section>


        {/* ========================= */}
        {/* INTERVIEW HISTORY */}
        {/* ========================= */}

        <section className="history-card">

          <div className="history-header">

            <div>

              <span className="section-eyebrow">
                PRACTICE HISTORY
              </span>

              <h2>
                Interview History
              </h2>

              <p>
                Review your previous interview
                sessions and results.
              </p>

            </div>

          </div>


          {/* SEARCH */}

          <div className="search-controls">

            <input
              type="text"
              placeholder="Search by job role..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >

              <option value="all">
                All Interviews
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="not_evaluated">
                Not Evaluated
              </option>

            </select>

          </div>


          {/* HISTORY */}

          {filteredInterviews.length === 0 ? (

            <div className="history-empty">

              <div>
                📋
              </div>

              <h3>
                No interviews found
              </h3>

              <p>
                Start an interview to build
                your preparation history.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/interview/setup"
                  )
                }
              >
                Start Interview
              </button>

            </div>

          ) : (

            <div className="interview-history-grid">

              {filteredInterviews.map(
                (interview) => (

                  <div
                    className="interview-card"
                    key={interview.id}
                  >

                    <div className="interview-card-top">

                      <div>

                        <span className="interview-type-label">
                          {interview.interview_type}
                        </span>

                        <h3>
                          {interview.job_role}
                        </h3>

                      </div>

                      <div className="interview-score">

                        {interview.has_result
                          ? interview.score
                          : "--"}

                        <span>
                          /100
                        </span>

                      </div>

                    </div>


                    <div className="interview-details">

                      <p>

                        <strong>
                          Experience
                        </strong>

                        <span>
                          {interview.experience_level}
                        </span>

                      </p>


                      <p>

                        <strong>
                          Questions
                        </strong>

                        <span>
                          {interview.number_of_questions}
                        </span>

                      </p>


                      <p>

                        <strong>
                          Date
                        </strong>

                        <span>
                          {new Date(
                            interview.created_at
                          ).toLocaleDateString()}
                        </span>

                      </p>

                    </div>


                    <div className="interview-status">

                      {interview.has_result ? (

                        <span className="status-completed">
                          ✓ Completed
                        </span>

                      ) : (

                        <span className="status-pending">
                          ⏳ Not Evaluated
                        </span>

                      )}

                    </div>


                    <div className="interview-actions">

                      {interview.has_result && (

                        <button
                          className="view-button"
                          onClick={() =>
                            handleViewResult(
                              interview.id
                            )
                          }
                        >
                          View Result
                        </button>

                      )}

                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDeleteInterview(
                            interview.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ========================= */}
        {/* QUICK ACTIONS */}
        {/* ========================= */}

        <section className="quick-actions">

          <button
            onClick={() =>
              navigate("/interview/setup")
            }
          >
            🎤 Start New Interview
          </button>


          <button
            onClick={() =>
              navigate("/resume")
            }
          >
            📄 Analyze Resume
          </button>


          <button
            onClick={() =>
              navigate("/resume/history")
            }
          >
            📋 Resume History
          </button>

        </section>


        {/* ========================= */}
        {/* FOOTER */}
        {/* ========================= */}

        <footer className="dashboard-footer">

          <p>
            AI Interviewer • Your personal
            interview preparation platform
          </p>

          <button
            onClick={handleLogout}
          >
            Logout
          </button>

        </footer>

      </div>

    </div>
  );
}

export default Dashboard;
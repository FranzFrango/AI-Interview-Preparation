import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./InterviewSetup.css";

function InterviewSetup() {
  const navigate = useNavigate();

  // =====================================================
  // INTERVIEW SETTINGS
  // =====================================================

  const [jobRole, setJobRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // START INTERVIEW
  // =====================================================

  const handleStartInterview = async (e) => {
    e.preventDefault();

    setError("");

    // Check all fields
    if (
      !jobRole ||
      !experienceLevel ||
      !interviewType ||
      !numberOfQuestions
    ) {
      setError(
        "Please complete all interview settings."
      );
      return;
    }

    setLoading(true);

    try {
      // =================================================
      // CREATE INTERVIEW
      // =================================================

      const response = await api.post(
        "/interviews/create/",
        {
          job_role: jobRole,
          experience_level: experienceLevel,
          interview_type: interviewType,
          number_of_questions: Number(
            numberOfQuestions
          ),
        }
      );

      const interviewId = response.data.id;

      // Save interview ID
      localStorage.setItem(
        "interview_id",
        interviewId
      );

      // =================================================
      // GENERATE QUESTIONS
      // =================================================

      await api.post(
        `/interviews/${interviewId}/generate-questions/`
      );

      // =================================================
      // GO TO INTERVIEW
      // =================================================

      navigate("/interview");

    } catch (error) {
      console.error(
        "Interview creation error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.error ||
          "Unable to start interview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="interview-setup">

      <div className="interview-setup-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="interview-setup-header">

          <div className="interview-setup-header-icon">
            🎤
          </div>

          <h1>
            Interview Setup
          </h1>

          <p>
            Configure your interview and let AI
            prepare personalized questions based
            on your role and experience.
          </p>

        </div>


        {/* =================================================
            FORM CARD
        ================================================= */}

        <div className="interview-setup-card">

          <div className="interview-setup-card-header">

            <div className="card-header-icon">
              ⚙
            </div>

            <div>
              <h2>
                Configure Your Interview
              </h2>

              <p>
                Choose your preferences before
                starting the interview.
              </p>
            </div>

          </div>


          <form onSubmit={handleStartInterview}>

            {/* =================================================
                JOB ROLE
            ================================================= */}

            <div className="interview-form-group">

              <label htmlFor="job-role">
                Job Role
              </label>

              <input
                id="job-role"
                type="text"
                value={jobRole}
                onChange={(e) =>
                  setJobRole(e.target.value)
                }
                placeholder="e.g. Python Developer"
              />

              <span className="form-hint">
                Enter the position you are
                preparing for.
              </span>

            </div>


            {/* =================================================
                EXPERIENCE
            ================================================= */}

            <div className="interview-form-group">

              <label htmlFor="experience">
                Experience Level
              </label>

              <select
                id="experience"
                value={experienceLevel}
                onChange={(e) =>
                  setExperienceLevel(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select experience level
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

              <span className="form-hint">
                Select the level that best matches
                your current experience.
              </span>

            </div>


            {/* =================================================
                INTERVIEW TYPE
            ================================================= */}

            <div className="interview-form-group">

              <label htmlFor="interview-type">
                Interview Type
              </label>

              <select
                id="interview-type"
                value={interviewType}
                onChange={(e) =>
                  setInterviewType(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select interview type
                </option>

                <option value="technical">
                  Technical
                </option>

                <option value="hr">
                  HR
                </option>

                <option value="behavioral">
                  Behavioral
                </option>

              </select>

              <span className="form-hint">
                AI will generate questions based
                on this interview category.
              </span>

            </div>


            {/* =================================================
                NUMBER OF QUESTIONS
            ================================================= */}

            <div className="interview-form-group">

              <label htmlFor="question-count">
                Number of Questions
              </label>

              <select
                id="question-count"
                value={numberOfQuestions}
                onChange={(e) =>
                  setNumberOfQuestions(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select number of questions
                </option>

                <option value="5">
                  5 Questions
                </option>

                <option value="10">
                  10 Questions
                </option>

                <option value="15">
                  15 Questions
                </option>

                <option value="20">
                  20 Questions
                </option>

              </select>

              <span className="form-hint">
                Choose how many questions you want
                to practice.
              </span>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

              <div className="interview-error">

                <div className="interview-error-icon">
                  !
                </div>

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* =================================================
                START
            ================================================= */}

            <button
              type="submit"
              className="start-interview-button"
              disabled={loading}
            >

              {loading
                ? "Preparing Interview..."
                : "Start Interview →"}

            </button>


            {/* =================================================
                BACK
            ================================================= */}

            <button
              type="button"
              className="back-dashboard-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </form>

        </div>


        {/* =====================================================
            INFORMATION
        ===================================================== */}

        <div className="interview-info-grid">

          <div className="interview-info-card">

            <div className="interview-info-card-icon">
              🤖
            </div>

            <strong>
              AI Generated
            </strong>

            <span>
              Personalized questions
            </span>

          </div>


          <div className="interview-info-card">

            <div className="interview-info-card-icon">
              📊
            </div>

            <strong>
              Performance Analysis
            </strong>

            <span>
              Detailed feedback
            </span>

          </div>


          <div className="interview-info-card">

            <div className="interview-info-card-icon">
              🚀
            </div>

            <strong>
              Improve Skills
            </strong>

            <span>
              Track your progress
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default InterviewSetup;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./InterviewResult.css";

function InterviewResult() {
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const interviewId =
          localStorage.getItem("interview_id");

        if (!interviewId) {
          setError(
            "Interview information is missing."
          );
          return;
        }

        const response = await api.get(
          `/interviews/${interviewId}/result/`
        );

        setResult(response.data);
      } catch (error) {
        console.error(
          "Failed to load result:",
          error.response?.data || error
        );

        setError(
          "Unable to load interview result."
        );
      }
    };

    fetchResult();
  }, []);

  if (error) {
    return (
      <div className="result-page">

        <div className="result-container">

          <div className="result-error">

            <div className="result-error-icon">
              !
            </div>

            <h2>{error}</h2>

            <button
              className="dashboard-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>

        </div>

      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-page">

        <div className="result-container">

          <div className="result-loading">

            <div className="loading-spinner"></div>

            <h2>
              Analyzing your interview...
            </h2>

            <p>
              Preparing your performance report.
            </p>

          </div>

        </div>

      </div>
    );
  }

  const score = Number(result.score) || 0;

  const questionScores =
    Array.isArray(result.question_scores)
      ? result.question_scores
      : [];

  const skippedQuestions =
    questionScores.filter(
      (question) =>
        !question.answer ||
        question.answer === "[NO ANSWER]" ||
        question.feedback ===
          "No answer was provided."
    );

  const answeredQuestions =
    questionScores.length -
    skippedQuestions.length;

  const totalQuestions =
    questionScores.length;

  let performance = "";
  let performanceMessage = "";

  if (score >= 90) {
    performance =
      "Outstanding Performance";

    performanceMessage =
      "Excellent work! You demonstrated strong interview skills.";
  } else if (score >= 75) {
    performance =
      "Excellent Performance";

    performanceMessage =
      "Great job! You performed very well in this interview.";
  } else if (score >= 60) {
    performance =
      "Good Performance";

    performanceMessage =
      "Good effort! A little more practice can make you stronger.";
  } else if (score >= 40) {
    performance =
      "Needs Improvement";

    performanceMessage =
      "You're making progress. Focus on your weaker areas.";
  } else {
    performance =
      "Keep Practicing";

    performanceMessage =
      "Don't worry. Practice regularly and improve step by step.";
  }

  const getScoreClass = (value) => {
    if (value >= 80) {
      return "excellent";
    }

    if (value >= 60) {
      return "good";
    }

    if (value >= 40) {
      return "average";
    }

    return "low";
  };

  return (
    <div className="result-page">

      <div className="result-container">

        {/* HEADER */}

        <div className="result-header">

          <span className="result-eyebrow">
            INTERVIEW RESULT
          </span>

          <h1>
            Interview Results
          </h1>

          <p>
            Here's a detailed overview of your
            interview performance.
          </p>

        </div>


        {/* SCORE HERO */}

        <div className="score-card">

          <span className="score-label">
            YOUR SCORE
          </span>

          <div
            className={`score-number ${getScoreClass(
              score
            )}`}
          >
            {score}
            <span>/100</span>
          </div>

          <h2
            className={`performance-title ${getScoreClass(
              score
            )}`}
          >
            {performance}
          </h2>

          <p className="score-message">
            {performanceMessage}
          </p>

        </div>


        {/* SUMMARY */}

        <div className="summary-grid">

          <div className="summary-card">

            <span>
              TOTAL QUESTIONS
            </span>

            <strong>
              {totalQuestions}
            </strong>

          </div>

          <div className="summary-card">

            <span>
              ANSWERED
            </span>

            <strong>
              {answeredQuestions}
            </strong>

          </div>

          <div className="summary-card">

            <span>
              SKIPPED
            </span>

            <strong>
              {skippedQuestions.length}
            </strong>

          </div>

          <div className="summary-card">

            <span>
              SCORE
            </span>

            <strong>
              {score}/100
            </strong>

          </div>

        </div>


        {/* PERFORMANCE OVERVIEW */}

        <div className="performance-card">

          <div className="section-heading">

            <span>
              PERFORMANCE
            </span>

            <h2>
              Interview Summary
            </h2>

          </div>

          <div className="performance-progress">

            <div className="performance-progress-top">

              <span>
                Overall Performance
              </span>

              <strong>
                {score}/100
              </strong>

            </div>

            <div className="progress-track">

              <div
                className={`progress-fill ${getScoreClass(
                  score
                )}`}
                style={{
                  width: `${Math.min(
                    score,
                    100
                  )}%`,
                }}
              ></div>

            </div>

          </div>

          <div className="performance-row">

            <span>
              Performance Level
            </span>

            <strong>
              {performance}
            </strong>

          </div>

          <div className="performance-row">

            <span>
              Answered Questions
            </span>

            <strong>
              {answeredQuestions} /{" "}
              {totalQuestions}
            </strong>

          </div>

          <div className="performance-row">

            <span>
              Skipped Questions
            </span>

            <strong>
              {skippedQuestions.length}
            </strong>

          </div>

        </div>


        {/* AI FEEDBACK */}

        <div className="feedback-card">

          <div className="feedback-heading">

            <div className="feedback-icon">
              ✦
            </div>

            <div>

              <span>
                AI ANALYSIS
              </span>

              <h2>
                AI Detailed Feedback
              </h2>

              <p>
                Personalized feedback based on
                your interview performance.
              </p>

            </div>

          </div>

          <div className="feedback-content">
            {result.feedback}
          </div>

        </div>


        {/* QUESTION RESULTS */}

        {questionScores.length > 0 && (

          <div className="question-section">

            <div className="section-heading">

              <span>
                DETAILED RESULTS
              </span>

              <h2>
                Question-by-Question Results
              </h2>

              <p>
                Review each answer and understand
                where you can improve.
              </p>

            </div>


            {questionScores.map(
              (question, index) => {

                const isSkipped =
                  !question.answer ||
                  question.answer ===
                    "[NO ANSWER]" ||
                  question.feedback ===
                    "No answer was provided.";

                return (
                  <div
                    key={index}
                    className="question-result"
                  >

                    {/* QUESTION HEADER */}

                    <div className="question-result-header">

                      <div>

                        <span className="question-label">
                          QUESTION{" "}
                          {index + 1}
                        </span>

                        <h3>
                          {question.question ||
                            question.question_text ||
                            "Interview question"}
                        </h3>

                      </div>

                      <div
                        className={`question-score ${
                          isSkipped
                            ? "skipped"
                            : getScoreClass(
                                Number(
                                  question.score
                                ) || 0
                              )
                        }`}
                      >
                        {isSkipped
                          ? "Skipped"
                          : `${
                              question.score ||
                              0
                            }/100`}
                      </div>

                    </div>


                    {/* SKIPPED */}

                    {isSkipped ? (

                      <div className="skipped-box">

                        <strong>
                          Question skipped
                        </strong>

                        <p>
                          No answer was provided
                          for this question.
                        </p>

                        <p>
                          Practice this topic
                          and try it again in
                          your next interview.
                        </p>

                      </div>

                    ) : (

                      <>

                        {/* ANSWER */}

                        <div className="answer-box">

                          <span>
                            YOUR ANSWER
                          </span>

                          <p>
                            {question.answer ||
                              question.answer_text ||
                              "No answer provided."}
                          </p>

                        </div>


                        {/* FEEDBACK */}

                        <div className="question-feedback-box">

                          <span>
                            AI FEEDBACK
                          </span>

                          <p>
                            {question.feedback ||
                              "No feedback available."}
                          </p>

                        </div>


                        {/* SUGGESTED ANSWER */}

                        {question.correct_answer && (

                          <div className="suggested-box">

                            <span>
                              SUGGESTED ANSWER
                            </span>

                            <p>
                              {
                                question.correct_answer
                              }
                            </p>

                          </div>

                        )}


                        {/* IMPROVEMENT */}

                        {question.improvement && (

                          <div className="improvement-box">

                            <span>
                              HOW TO IMPROVE
                            </span>

                            <p>
                              {
                                question.improvement
                              }
                            </p>

                          </div>

                        )}

                      </>

                    )}

                  </div>
                );
              }
            )}

          </div>

        )}


        {/* ACTIONS */}

        <div className="result-actions">

          <button
            className="dashboard-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Back to Dashboard
          </button>

          <button
            className="retake-button"
            onClick={() =>
              navigate("/interview/setup")
            }
          >
            Retake Interview →
          </button>

        </div>


        {/* FOOTER */}

        <div className="result-footer">
          🔒 Your interview data is securely
          stored and accessible only to you.
        </div>

      </div>

    </div>
  );
}

export default InterviewResult;
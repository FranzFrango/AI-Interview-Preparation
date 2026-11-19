import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import "./Interview.css";

function Interview() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const interviewId =
    localStorage.getItem("interview_id");

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!interviewId) {
        setError("Interview session not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/interviews/${interviewId}/questions/`
        );

        setQuestions(response.data);
      } catch (error) {
        console.error(
          "Questions error:",
          error.response?.data || error
        );

        setError(
          "Unable to load interview questions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [interviewId]);

  const current = questions[currentQuestion];

  const currentAnswer =
    current && answers[current.id]
      ? answers[current.id]
      : "";

  const handleAnswerChange = (e) => {
    if (!current) return;

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [current.id]: e.target.value,
    }));
  };

  const handleNext = () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        currentQuestion + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        currentQuestion - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleFinish = async () => {
    if (!interviewId) {
      setError("Interview session not found.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      /*
       * Submit every answer.
       */
      for (const question of questions) {
        await api.post(
          `/interviews/${interviewId}/answers/`,
          {
            question: question.id,
            answer_text:
              answers[question.id] || "",
          }
        );
      }

      /*
       * Evaluate the complete interview.
       */
      await api.post(
        `/interviews/${interviewId}/evaluate/`
      );

      navigate("/interview/result");
    } catch (error) {
      console.error(
        "Interview submission error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.error ||
          "Unable to submit interview."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    const confirmed = window.confirm(
      "Are you sure you want to exit this interview?"
    );

    if (confirmed) {
      navigate("/dashboard");
    }
  };

  /*
   * Loading screen
   */
  if (loading) {
    return (
      <div className="interview-page-message">
        <div className="interview-message-card">
          <div className="interview-spinner"></div>

          <h2>
            Preparing Your Interview
          </h2>

          <p>
            Loading your AI-generated
            questions...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error screen
   */
  if (
    error &&
    questions.length === 0
  ) {
    return (
      <div className="interview-page-message">
        <div className="interview-message-card">
          <div className="error-icon">
            !
          </div>

          <h2>
            Interview Unavailable
          </h2>

          <p>{error}</p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /*
   * No questions
   */
  if (!current) {
    return (
      <div className="interview-page-message">
        <div className="interview-message-card">
          <div className="error-icon">
            !
          </div>

          <h2>
            No Questions Available
          </h2>

          <p>
            We could not find questions for
            this interview.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/interview/setup")
            }
          >
            Start Again
          </button>
        </div>
      </div>
    );
  }

  const progress =
    ((currentQuestion + 1) /
      questions.length) *
    100;

  const answeredCount =
    Object.values(answers).filter(
      (answer) =>
        answer &&
        answer.trim().length > 0
    ).length;

  return (
    <div className="interview-page">

      <div className="interview-container">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="interview-header">

          <div className="interview-header-content">

            <span className="interview-eyebrow">
              AI INTERVIEW SESSION
            </span>

            <h1>
              Mock Interview
            </h1>

            <p>
              Answer each question carefully.
              Your responses will be evaluated
              by AI after the interview.
            </p>

          </div>

          <button
            className="exit-button"
            onClick={handleExit}
          >
            Exit Interview
          </button>

        </section>


        {/* =================================================
            PROGRESS
        ================================================= */}

        <section className="interview-progress-card">

          <div className="progress-top">

            <div className="progress-question">

              <span>
                CURRENT QUESTION
              </span>

              <strong>
                {String(
                  currentQuestion + 1
                ).padStart(2, "0")}

                <small>
                  {" "}
                  /{" "}
                  {String(
                    questions.length
                  ).padStart(2, "0")}
                </small>
              </strong>

            </div>

            <div className="answered-count">
              {answeredCount} of{" "}
              {questions.length} answered
            </div>

          </div>

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            ></div>

          </div>

          <div className="progress-percentage">
            {Math.round(progress)}% complete
          </div>

        </section>


        {/* =================================================
            PROFESSIONAL QUESTION AREA
        ================================================= */}

        <section className="question-card">

          {/* Blue top border */}
          <div className="question-accent"></div>

          {/* Question header */}
          <div className="question-card-header">

            <div className="question-label">

              <span className="question-label-icon">
                Q
              </span>

              <div>
                <span className="question-label-small">
                  INTERVIEW QUESTION
                </span>

                <strong>
                  Question{" "}
                  {currentQuestion + 1}
                </strong>
              </div>

            </div>

            <div className="question-counter">
              {currentQuestion + 1} /{" "}
              {questions.length}
            </div>

          </div>


          {/* Main question */}
          <div className="question-content">

            <h2>
              {current.question_text}
            </h2>

          </div>


          {/* Interview tip */}
          <div className="question-tip">

            <div className="question-tip-icon">
              💡
            </div>

            <div className="question-tip-content">

              <strong>
                Interview Tip
              </strong>

              <p>
                Explain your answer clearly
                and include practical examples
                whenever possible.
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            PROFESSIONAL ANSWER AREA
        ================================================= */}

        <section className="answer-card">

          <div className="answer-card-header">

            <div>

              <span className="section-eyebrow">
                YOUR RESPONSE
              </span>

              <h2>
                Write Your Answer
              </h2>

              <p>
                Give your best response as if
                you were speaking to an interviewer.
              </p>

            </div>

            <div className="answer-status">

              <span className="answer-status-dot"></span>

              Ready

            </div>

          </div>


          <div className="answer-input-wrapper">

            <textarea
              value={currentAnswer}
              onChange={handleAnswerChange}
              placeholder="Start typing your answer here..."
              rows={10}
            />

            <div className="textarea-bottom">

              <span>
                Your answer will be evaluated
                by AI.
              </span>

              <span className="character-count">
                {currentAnswer.length} characters
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="interview-error">
            <span>!</span>
            {error}
          </div>
        )}


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <section className="interview-navigation">

          <button
            className="secondary-button"
            onClick={handlePrevious}
            disabled={
              currentQuestion === 0
            }
          >
            ← Previous
          </button>

          <div className="navigation-center">

            <span>
              Question{" "}
              {currentQuestion + 1} of{" "}
              {questions.length}
            </span>

          </div>

          {currentQuestion ===
          questions.length - 1 ? (

            <button
              className="finish-button"
              onClick={handleFinish}
              disabled={submitting}
            >
              {submitting
                ? "Evaluating..."
                : "Finish Interview ✓"}
            </button>

          ) : (

            <button
              className="primary-button"
              onClick={handleNext}
            >
              Next Question →
            </button>

          )}

        </section>

      </div>

    </div>
  );
}

export default Interview;
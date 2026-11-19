import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api/axios";
import "./ResumeQuiz.css";

function ResumeQuiz() {
    const navigate = useNavigate();

    // =====================================================
    // RESUME STATE
    // =====================================================

    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState("");

    // =====================================================
    // QUIZ SETTINGS
    // =====================================================

    const [numberOfQuestions, setNumberOfQuestions] =
        useState("5");

    // =====================================================
    // QUIZ STATE
    // =====================================================

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);

    const [currentQuestion, setCurrentQuestion] =
        useState(0);

    // =====================================================
    // RESULT STATE
    // =====================================================

    const [score, setScore] = useState(null);
    const [results, setResults] = useState([]);

    // =====================================================
    // LOADING STATE
    // =====================================================

    const [loadingResumes, setLoadingResumes] =
        useState(true);

    const [generating, setGenerating] =
        useState(false);

    const [evaluating, setEvaluating] =
        useState(false);

    const [error, setError] = useState("");

    // =====================================================
    // LOAD RESUMES
    // =====================================================

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        try {
            setLoadingResumes(true);
            setError("");

            const response = await api.get(
                "/interviews/resume/history/"
            );

            console.log(
                "RESUME HISTORY RESPONSE:",
                response.data
            );

            let resumeList = [];

            // ---------------------------------------------
            // API RETURNS AN ARRAY
            // ---------------------------------------------

            if (Array.isArray(response.data)) {
                resumeList = response.data;
            }

            // ---------------------------------------------
            // API RETURNS { results: [...] }
            // ---------------------------------------------

            else if (
                Array.isArray(response.data.results)
            ) {
                resumeList = response.data.results;
            }

            // ---------------------------------------------
            // API RETURNS { resumes: [...] }
            // ---------------------------------------------

            else if (
                Array.isArray(response.data.resumes)
            ) {
                resumeList = response.data.resumes;
            }

            // ---------------------------------------------
            // API RETURNS { resume: {...} }
            // ---------------------------------------------

            else if (response.data.resume) {
                resumeList = [response.data.resume];
            }

            console.log(
                "RESUMES LOADED:",
                resumeList
            );

            setResumes(resumeList);

            // Automatically select the first resume
            // only if resumes are available.
            if (resumeList.length > 0) {
                setSelectedResume(
                    String(resumeList[0].id)
                );
            }

        } catch (error) {
            console.error(
                "Unable to load resumes:",
                error.response?.data || error
            );

            setResumes([]);

            setError(
                error.response?.data?.error ||
                    "Unable to load your resumes."
            );

        } finally {
            setLoadingResumes(false);
        }
    };

    // =====================================================
    // GET RESUME FILE NAME
    // =====================================================

    const getResumeName = (resume) => {
        if (!resume) {
            return "Resume";
        }

        if (resume.file) {
            return resume.file
                .split("/")
                .pop();
        }

        return `Resume ${resume.id}`;
    };

    // =====================================================
    // GENERATE QUIZ
    // =====================================================

    const handleGenerateQuiz = async (e) => {
        e.preventDefault();

        setError("");
        setQuestions([]);
        setAnswers([]);
        setResults([]);
        setScore(null);
        setCurrentQuestion(0);

        // ---------------------------------------------
        // CHECK RESUME
        // ---------------------------------------------

        if (!selectedResume) {
            setError(
                "Please select a resume first."
            );
            return;
        }

        // ---------------------------------------------
        // START GENERATION
        // ---------------------------------------------

        setGenerating(true);

        try {
            console.log(
                "Generating quiz for resume:",
                selectedResume
            );

            const response = await api.post(
                "/interviews/resume-quiz/generate/",
                {
                    resume_id:
                        Number(selectedResume),

                    number_of_questions:
                        Number(numberOfQuestions),
                }
            );

            console.log(
                "RESUME QUIZ GENERATION RESPONSE:",
                response.data
            );

            const generatedQuestions =
                response.data.questions || [];

            if (
                generatedQuestions.length === 0
            ) {
                setError(
                    "The AI did not generate any questions."
                );
                return;
            }

            setQuestions(
                generatedQuestions
            );

            setAnswers(
                new Array(
                    generatedQuestions.length
                ).fill("")
            );

        } catch (error) {
            console.error(
                "Resume Quiz generation error:",
                error.response?.data || error
            );

            setError(
                error.response?.data?.error ||
                    "Unable to generate the resume quiz."
            );

        } finally {
            setGenerating(false);
        }
    };

    // =====================================================
    // ANSWER CHANGE
    // =====================================================

    const handleAnswerChange = (value) => {
        const updatedAnswers = [
            ...answers,
        ];

        updatedAnswers[currentQuestion] =
            value;

        setAnswers(updatedAnswers);
    };

    // =====================================================
    // NEXT QUESTION
    // =====================================================

    const handleNext = () => {
        if (
            currentQuestion <
            questions.length - 1
        ) {
            setCurrentQuestion(
                currentQuestion + 1
            );
        }
    };

    // =====================================================
    // PREVIOUS QUESTION
    // =====================================================

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(
                currentQuestion - 1
            );
        }
    };

    // =====================================================
    // SUBMIT QUIZ
    // =====================================================

    const handleSubmitQuiz = async () => {
        setError("");
        setEvaluating(true);

        try {
            const response = await api.post(
                "/interviews/resume-quiz/evaluate/",
                {
                    resume_id:
                        Number(selectedResume),

                    questions: questions,

                    answers: answers,
                }
            );

            console.log(
                "RESUME QUIZ EVALUATION RESPONSE:",
                response.data
            );

            setScore(
                response.data.score
            );

            setResults(
                response.data.question_results ||
                    []
            );

        } catch (error) {
            console.error(
                "Resume Quiz evaluation error:",
                error.response?.data || error
            );

            setError(
                error.response?.data?.error ||
                    "Unable to evaluate the resume quiz."
            );

        } finally {
            setEvaluating(false);
        }
    };

    // =====================================================
    // RESTART QUIZ
    // =====================================================

    const handleRestart = () => {
        setQuestions([]);
        setAnswers([]);
        setResults([]);
        setScore(null);
        setCurrentQuestion(0);
        setError("");
    };

    // =====================================================
    // PERFORMANCE LABEL
    // =====================================================

    const getPerformanceLabel = (value) => {
        if (value >= 80) {
            return "Excellent Performance";
        }

        if (value >= 60) {
            return "Good Performance";
        }

        if (value >= 40) {
            return "Needs Improvement";
        }

        return "Keep Practicing";
    };

    // =====================================================
    // SCORE CLASS
    // =====================================================

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

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="resume-quiz-page">

            <div className="resume-quiz-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="resume-quiz-header">

                    <div className="resume-quiz-icon">
                        🧠
                    </div>

                    <h1>
                        Resume Quiz
                    </h1>

                    <p>
                        Test your knowledge based on
                        your own resume.
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="resume-quiz-error">
                        {error}
                    </div>
                )}


                {/* =================================================
                    RESULT SCREEN
                ================================================= */}

                {score !== null ? (

                    <div className="resume-quiz-results-page">

                        {/* RESULT HEADER */}

                        <div className="resume-quiz-result-hero">

                            <span className="resume-quiz-result-eyebrow">
                                RESUME QUIZ RESULT
                            </span>

                            <h2>
                                Your Resume Quiz Score
                            </h2>

                            <div
                                className={`resume-quiz-big-score ${getScoreClass(
                                    score
                                )}`}
                            >
                                {score}
                                <span>/100</span>
                            </div>

                            <h3
                                className={`resume-quiz-performance ${getScoreClass(
                                    score
                                )}`}
                            >
                                {getPerformanceLabel(
                                    score
                                )}
                            </h3>

                            <p>
                                Your answers were
                                evaluated based on
                                the content of your
                                selected resume.
                            </p>

                        </div>


                        {/* SUMMARY */}

                        <div className="resume-quiz-summary-card">

                            <div>
                                <span>
                                    QUESTIONS
                                </span>

                                <strong>
                                    {results.length}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    SCORE
                                </span>

                                <strong>
                                    {score}/100
                                </strong>
                            </div>

                            <div>
                                <span>
                                    STATUS
                                </span>

                                <strong>
                                    Completed
                                </strong>
                            </div>

                        </div>


                        {/* QUESTION FEEDBACK */}

                        <div className="resume-quiz-feedback-section">

                            <div className="resume-quiz-feedback-heading">

                                <span>
                                    DETAILED RESULTS
                                </span>

                                <h2>
                                    Question Feedback
                                </h2>

                                <p>
                                    Review your answers
                                    and see how you can
                                    improve.
                                </p>

                            </div>


                            {results.map(
                                (result, index) => (

                                    <div
                                        key={index}
                                        className="resume-quiz-result-item"
                                    >

                                        {/* QUESTION HEADER */}

                                        <div className="resume-quiz-result-header">

                                            <div>

                                                <span className="resume-quiz-question-label">
                                                    QUESTION{" "}
                                                    {result.question_number}
                                                </span>

                                                <h3>
                                                    {
                                                        result.question
                                                    }
                                                </h3>

                                            </div>

                                            <div
                                                className={`resume-quiz-question-score ${getScoreClass(
                                                    result.score
                                                )}`}
                                            >
                                                {
                                                    result.score
                                                }
                                                <span>
                                                    /100
                                                </span>
                                            </div>

                                        </div>


                                        {/* YOUR ANSWER */}

                                        <div className="resume-quiz-answer-section">

                                            <span>
                                                YOUR ANSWER
                                            </span>

                                            <p>
                                                {
                                                    result.answer ||
                                                    "No answer provided."
                                                }
                                            </p>

                                        </div>


                                        {/* AI FEEDBACK */}

                                        <div className="resume-quiz-feedback-box">

                                            <span>
                                                AI FEEDBACK
                                            </span>

                                            <p>
                                                {
                                                    result.feedback
                                                }
                                            </p>

                                        </div>


                                        {/* IMPROVEMENT */}

                                        <div className="resume-quiz-improvement-box">

                                            <span>
                                                HOW TO IMPROVE
                                            </span>

                                            <p>
                                                {
                                                    result.improvement
                                                }
                                            </p>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>


                        {/* RESULT BUTTONS */}

                        <div className="resume-quiz-result-actions">

                            <button
                                className="resume-quiz-primary-button"
                                onClick={
                                    handleRestart
                                }
                            >
                                Take Another Resume Quiz
                            </button>

                            <button
                                className="resume-quiz-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "/dashboard"
                                    )
                                }
                            >
                                ← Back to Dashboard
                            </button>

                        </div>

                    </div>

                ) : questions.length === 0 ? (

                    /* =================================================
                       QUIZ SETUP
                    ================================================= */

                    <div className="resume-quiz-card">

                        <h2>
                            Configure Your Resume Quiz
                        </h2>

                        <form
                            onSubmit={
                                handleGenerateQuiz
                            }
                        >

                            {/* =================================================
                                SELECT RESUME
                            ================================================= */}

                            <div className="resume-quiz-form-group">

                                <label>
                                    Select Resume
                                </label>

                                <select
                                    value={
                                        selectedResume
                                    }
                                    onChange={(e) =>
                                        setSelectedResume(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        loadingResumes ||
                                        generating
                                    }
                                >

                                    <option value="">
                                        {loadingResumes
                                            ? "Loading resumes..."
                                            : resumes.length ===
                                              0
                                            ? "No resumes available"
                                            : "Select your resume"}
                                    </option>

                                    {resumes.map(
                                        (resume) => (

                                            <option
                                                key={
                                                    resume.id
                                                }
                                                value={
                                                    resume.id
                                                }
                                            >
                                                {getResumeName(
                                                    resume
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* =================================================
                                NUMBER OF QUESTIONS
                            ================================================= */}

                            <div className="resume-quiz-form-group">

                                <label>
                                    Number of Questions
                                </label>

                                <select
                                    value={
                                        numberOfQuestions
                                    }
                                    onChange={(e) =>
                                        setNumberOfQuestions(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        generating
                                    }
                                >

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

                            </div>


                            {/* =================================================
                                START QUIZ
                            ================================================= */}

                            <button
                                type="submit"
                                className="resume-quiz-primary-button"
                                disabled={
                                    generating ||
                                    loadingResumes ||
                                    resumes.length ===
                                        0 ||
                                    !selectedResume
                                }
                            >
                                {generating
                                    ? "Generating Resume Quiz..."
                                    : "Start Resume Quiz →"}
                            </button>

                        </form>

                    </div>

                ) : (

                    /* =================================================
                       QUIZ
                    ================================================= */

                    <div>

                        {/* PROGRESS */}

                        <div className="resume-quiz-progress">

                            <div className="resume-quiz-progress-text">

                                Question{" "}
                                {currentQuestion + 1}
                                {" "}
                                of{" "}
                                {questions.length}

                            </div>

                            <div className="resume-quiz-progress-bar">

                                <div
                                    className="resume-quiz-progress-fill"
                                    style={{
                                        width: `${
                                            ((currentQuestion +
                                                1) /
                                                questions.length) *
                                            100
                                        }%`,
                                    }}
                                />

                            </div>

                        </div>


                        {/* QUESTION CARD */}

                        <div className="resume-quiz-card">

                            <h2 className="resume-quiz-question">
                                {
                                    questions[
                                        currentQuestion
                                    ]
                                }
                            </h2>

                            <textarea
                                className="resume-quiz-answer"
                                value={
                                    answers[
                                        currentQuestion
                                    ] || ""
                                }
                                onChange={(e) =>
                                    handleAnswerChange(
                                        e.target.value
                                    )
                                }
                                placeholder="Type your answer here..."
                            />


                            {/* NAVIGATION */}

                            <div className="resume-quiz-navigation">

                                <button
                                    type="button"
                                    className="resume-quiz-secondary-button"
                                    onClick={
                                        handlePrevious
                                    }
                                    disabled={
                                        currentQuestion ===
                                        0
                                    }
                                >
                                    ← Previous
                                </button>


                                {currentQuestion <
                                questions.length -
                                    1 ? (

                                    <button
                                        type="button"
                                        className="resume-quiz-primary-button"
                                        onClick={
                                            handleNext
                                        }
                                    >
                                        Next →
                                    </button>

                                ) : (

                                    <button
                                        type="button"
                                        className="resume-quiz-primary-button"
                                        onClick={
                                            handleSubmitQuiz
                                        }
                                        disabled={
                                            evaluating
                                        }
                                    >
                                        {evaluating
                                            ? "Evaluating..."
                                            : "Submit Quiz ✓"}
                                    </button>

                                )}

                            </div>

                        </div>

                    </div>

                )}


                {/* =================================================
                    BACK TO DASHBOARD
                ================================================= */}

                {score === null && (

                    <div className="resume-quiz-bottom">

                        <button
                            type="button"
                            className="resume-quiz-secondary-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            ← Back to Dashboard
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
}

export default ResumeQuiz;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./ResumeAnalyzer.css";

function ResumeAnalyzer() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [resumeId, setResumeId] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or DOCX file.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    setUploading(true);
    setError("");
    setAnalysis("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
  "/interviews/resume/upload/",
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);

console.log(
  "RESUME UPLOAD RESPONSE:",
  response.data
);

const uploadedResumeId =
  response.data.id ||
  response.data.resume_id ||
  response.data.resume?.id;

console.log(
  "UPLOADED RESUME ID:",
  uploadedResumeId
);

if (!uploadedResumeId) {
  throw new Error(
    "Resume uploaded, but resume ID was not returned by the backend."
  );
}

setResumeId(uploadedResumeId);

await analyzeResume(uploadedResumeId);
    } catch (error) {
      console.error(
        "Resume upload error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.error ||
          "Unable to upload resume."
      );
    } finally {
      setUploading(false);
    }
  };

  const analyzeResume = async (id) => {
    setAnalyzing(true);
    setError("");

    try {
      const response = await api.post(
        `/interviews/resume/${id}/analyze/`
      );

      setAnalysis(response.data.analysis || "");
    } catch (error) {
      console.error(
        "Resume analysis error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.error ||
          "Unable to analyze resume."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeAgain = async () => {
    if (!resumeId) return;

    setAnalysis("");
    await analyzeResume(resumeId);
  };

  return (
    <div className="resume-page">
      <div className="resume-container">

        {/* HEADER */}

        <section className="resume-header">
          <div className="resume-header-icon">
            📄
          </div>

          <div>
            <span className="resume-eyebrow">
              AI CAREER ASSISTANT
            </span>

            <h1>Resume Analyzer</h1>

            <p>
              Upload your resume and receive an
              AI-powered analysis of your skills,
              experience, projects, and career profile.
            </p>
          </div>
        </section>

        {/* UPLOAD CARD */}

        <section className="upload-card">

          <div className="upload-card-header">
            <div>
              <span className="section-label">
                RESUME ANALYSIS
              </span>

              <h2>Upload Your Resume</h2>

              <p>
                Supported formats: PDF and DOCX
              </p>
            </div>
          </div>

          <label className="upload-area">

            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
            />

            <div className="upload-icon">
              ↑
            </div>

            <h3>
              {file
                ? file.name
                : "Choose your resume"}
            </h3>

            <p>
              {file
                ? "File selected successfully"
                : "Click here or drag and drop your file"}
            </p>

          </label>

          {file && (
            <div className="selected-file">
              <div className="file-icon">
                📄
              </div>

              <div className="file-info">
                <strong>{file.name}</strong>

                <span>
                  {(file.size / 1024 / 1024).toFixed(2)}
                  {" MB"}
                </span>
              </div>

              <span className="file-status">
                ✓ Ready
              </span>
            </div>
          )}

          {error && (
            <div className="resume-error">
              <span>!</span>
              {error}
            </div>
          )}

          <button
            className="analyze-button"
            onClick={handleUpload}
            disabled={
              !file ||
              uploading ||
              analyzing
            }
          >
            {uploading
              ? "Uploading..."
              : analyzing
              ? "Analyzing Resume..."
              : "Analyze Resume"}
          </button>

        </section>

        {/* LOADING */}

        {analyzing && (
          <section className="analysis-loading">

            <div className="loading-spinner"></div>

            <h2>
              AI is analyzing your resume
            </h2>

            <p>
              Reviewing your skills, education,
              projects, experience and ATS
              compatibility.
            </p>

          </section>
        )}

        {/* RESULT */}

        {analysis && !analyzing && (
          <ResumeAnalysisResult
            analysis={analysis}
          />
        )}

        {/* BOTTOM ACTIONS */}

        <section className="resume-actions">

          <button
            className="secondary-action"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

          <button
            className="secondary-action"
            onClick={() =>
              navigate("/resume/history")
            }
          >
            📋 Resume History
          </button>

          {analysis && (
            <button
              className="primary-action"
              onClick={handleAnalyzeAgain}
              disabled={analyzing}
            >
              ↻ Analyze Again
            </button>
          )}

        </section>

      </div>
    </div>
  );
}


/* =========================================================
   ANALYSIS RESULT
========================================================= */

function ResumeAnalysisResult({ analysis }) {

  const sections = parseAnalysis(analysis);

  return (
    <section className="analysis-result">

      {/* RESULT HEADER */}

      <div className="result-header">

        <div>
          <span className="resume-eyebrow">
            AI ANALYSIS COMPLETE
          </span>

          <h2>
            Resume Analysis Report
          </h2>

          <p>
            Here is the AI-generated assessment
            of your resume.
          </p>
        </div>

        <div className="result-check">
          ✓
        </div>

      </div>


      {/* SCORE */}

      {sections.score && (
        <div className="score-card">

          <div className="score-left">

            <span className="score-label">
              OVERALL RESUME SCORE
            </span>

            <div className="score-number">
              {sections.score}
              <span>/100</span>
            </div>

            <p>
              Overall assessment based on the
              information provided in your resume.
            </p>

          </div>

          <div className="score-circle">
            <div>
              {sections.score}
            </div>
            <span>Score</span>
          </div>

        </div>
      )}


      {/* SECTIONS */}

      <div className="analysis-sections">

        {sections.items.map(
          (section, index) => (

            <AnalysisSection
              key={index}
              section={section}
              index={index}
            />

          )
        )}

      </div>

    </section>
  );
}


/* =========================================================
   ANALYSIS SECTION
========================================================= */

function AnalysisSection({
  section,
  index,
}) {

  const icons = [
    "👤",
    "💻",
    "🤝",
    "🎓",
    "🚀",
    "💪",
    "⚠️",
    "🎯",
    "💼",
  ];

  return (
    <article className="analysis-section">

      <div className="analysis-section-header">

        <div className="analysis-section-icon">
          {icons[index] || "•"}
        </div>

        <div>
          <span>
            SECTION {index + 1}
          </span>

          <h3>
            {section.title}
          </h3>
        </div>

      </div>

      <div className="analysis-section-content">

        {section.content.map(
          (line, i) => {

            if (
              line.trim().startsWith("-")
            ) {
              return (
                <div
                  className="analysis-bullet"
                  key={i}
                >
                  <span>✓</span>

                  <p>
                    {cleanMarkdown(
                      line
                        .trim()
                        .substring(1)
                    )}
                  </p>
                </div>
              );
            }

            if (
              line.trim().startsWith("•")
            ) {
              return (
                <div
                  className="analysis-bullet"
                  key={i}
                >
                  <span>✓</span>

                  <p>
                    {cleanMarkdown(
                      line
                        .trim()
                        .substring(1)
                    )}
                  </p>
                </div>
              );
            }

            if (
              line.trim().startsWith("**") &&
              line.trim().endsWith("**")
            ) {
              return (
                <h4 key={i}>
                  {cleanMarkdown(
                    line.trim()
                  )}
                </h4>
              );
            }

            if (line.trim()) {
              return (
                <p key={i}>
                  {cleanMarkdown(line)}
                </p>
              );
            }

            return null;
          }
        )}

      </div>

    </article>
  );
}


/* =========================================================
   PARSE AI RESPONSE
========================================================= */

function parseAnalysis(text) {

  const lines = text
    .replace(/📌|💻|🤝|🎓|🚀|💪|⚠️|🤖|💼/g, "")
    .split("\n");

  let score = null;
  const items = [];

  let current = null;

  lines.forEach((line) => {

    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    /* SCORE */

    const scoreMatch =
      trimmed.match(
        /(?:Score|Overall Resume Score)\s*:\s*(\d+)/i
      );

    if (scoreMatch && !score) {
      score = Number(scoreMatch[1]);
      return;
    }


    /* NUMBERED HEADING */

    const headingMatch =
      trimmed.match(
        /^#{0,4}\s*(\d+)\.\s*(.+)$/i
      );

    if (headingMatch) {

      if (current) {
        items.push(current);
      }

      current = {
        title: headingMatch[2]
          .replace(/\*\*/g, "")
          .trim(),

        content: [],
      };

      return;
    }


    /* MARKDOWN HEADING */

    const markdownHeading =
      trimmed.match(
        /^#{1,4}\s+(.+)$/
      );

    if (markdownHeading) {

      if (current) {
        items.push(current);
      }

      current = {
        title: markdownHeading[1]
          .replace(/\*\*/g, "")
          .trim(),

        content: [],
      };

      return;
    }


    /* NORMAL CONTENT */

    if (current) {
      current.content.push(trimmed);
    }

  });


  if (current) {
    items.push(current);
  }


  /*
    FALLBACK
    If AI doesn't use numbered headings,
    show the complete response.
  */

  if (items.length === 0) {

    return {
      score,
      items: [
        {
          title: "Resume Assessment",
          content: lines.filter(
            (line) => line.trim()
          ),
        },
      ],
    };

  }


  return {
    score,
    items,
  };
}


/* =========================================================
   CLEAN MARKDOWN
========================================================= */

function cleanMarkdown(text) {

  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^[-•]\s*/, "")
    .trim();
}


export default ResumeAnalyzer;
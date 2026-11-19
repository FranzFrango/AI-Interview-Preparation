import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function ResumeHistory() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchResumeHistory();
  }, []);

  // =========================
  // FETCH RESUME HISTORY
  // =========================

  const fetchResumeHistory = async () => {
    try {
      const response = await api.get(
        "/interviews/resume/history/"
      );

      console.log(
        "Resume history:",
        response.data
      );

      setResumes(response.data);
    } catch (error) {
      console.error(
        "Resume history error:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Unable to load resume history."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GET SCORE
  // =========================

  const getScore = (text) => {
    if (!text) return null;

    const match = text.match(
      /(?:score)\s*[:\-]\s*\**\s*(\d{1,3})/i
    );

    if (match) {
      return Math.min(
        parseInt(match[1]),
        100
      );
    }

    return null;
  };

  // =========================
  // ANALYZE / REANALYZE
  // =========================

  const handleAnalyze = async (resumeId) => {
    try {
      setAnalyzingId(resumeId);
      setMessage("");

      const response = await api.post(
        `/interviews/resume/${resumeId}/analyze/`,
        {}
      );

      console.log(
        "Resume analysis:",
        response.data
      );

      setResumes((currentResumes) =>
        currentResumes.map((resume) =>
          resume.id === resumeId
            ? {
                ...resume,
                ai_analysis:
                  response.data.analysis,
              }
            : resume
        )
      );

      setMessage(
        "Resume analysis completed successfully!"
      );
    } catch (error) {
      console.error(
        "Resume analysis error:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Resume analysis failed."
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  // =========================
  // DELETE RESUME
  // =========================

  const handleDelete = async (resumeId) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this resume?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(resumeId);
      setMessage("");

      await api.delete(
        `/interviews/resume/${resumeId}/delete/`
      );

      setResumes((currentResumes) =>
        currentResumes.filter(
          (resume) =>
            resume.id !== resumeId
        )
      );

      setMessage(
        "Resume deleted successfully."
      );
    } catch (error) {
      console.error(
        "Resume delete error:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Unable to delete resume."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div style={styles.center}>

        <div style={styles.loadingCard}>

          <div style={styles.spinner}></div>

          <h2>
            Loading Resume History...
          </h2>

          <p>
            Preparing your uploaded resumes.
          </p>

        </div>

      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div style={styles.header}>

          <div>

            <span style={styles.eyebrow}>
              PRACTICE HISTORY
            </span>

            <h1 style={styles.title}>
              Resume History
            </h1>

            <p style={styles.subtitle}>
              View and manage your previously
              analyzed resumes.
            </p>

          </div>

          <button
            onClick={() =>
              navigate("/resume")
            }
            style={styles.newResumeButton}
          >
            + Analyze New Resume
          </button>

        </div>


        {/* ========================= */}
        {/* MESSAGE */}
        {/* ========================= */}

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}


        {/* ========================= */}
        {/* EMPTY */}
        {/* ========================= */}

        {!message &&
          resumes.length === 0 && (

            <div style={styles.emptyCard}>

              <div style={styles.emptyIcon}>
                📄
              </div>

              <h2>
                No Resume History
              </h2>

              <p>
                You haven't uploaded any
                resumes yet.
              </p>

              <button
                onClick={() =>
                  navigate("/resume")
                }
                style={styles.primaryButton}
              >
                Analyze Your First Resume
              </button>

            </div>

          )}


        {/* ========================= */}
        {/* RESUME HISTORY */}
        {/* ========================= */}

        {resumes.length > 0 && (

          <div style={styles.historyCard}>

            <div style={styles.historyHeader}>

              <div>

                <span style={styles.eyebrow}>
                  YOUR RESUMES
                </span>

                <h2 style={styles.historyTitle}>
                  Resume History
                </h2>

                <p style={styles.historySubtitle}>
                  Review your previously uploaded
                  resumes and analysis results.
                </p>

              </div>

            </div>


            {/* ========================= */}
            {/* RESUME LIST */}
            {/* ========================= */}

            <div>

              {resumes.map((resume) => {

                const score = getScore(
                  resume.ai_analysis
                );

                const isAnalyzing =
                  analyzingId === resume.id;

                const isDeleting =
                  deletingId === resume.id;

                return (

                  <div
                    key={resume.id}
                    style={styles.resumeItem}
                  >

                    {/* ========================= */}
                    {/* TOP */}
                    {/* ========================= */}

                    <div style={styles.resumeTop}>

                      <div style={styles.resumeFile}>

                        <div style={styles.fileIcon}>
                          📄
                        </div>

                        <div>

                          <span
                            style={styles.typeLabel}
                          >
                            RESUME
                          </span>

                          <h3
                            style={styles.fileName}
                          >
                            {resume.file
                              ? resume.file
                                  .split("/")
                                  .pop()
                              : "Resume"}
                          </h3>

                        </div>

                      </div>


                      <div
                        style={styles.resumeScore}
                      >
                        {score !== null
                          ? `${score}/100`
                          : "--/100"}
                      </div>

                    </div>


                    {/* ========================= */}
                    {/* DETAILS */}
                    {/* ========================= */}

                    <div style={styles.detailsGrid}>

                      <div style={styles.detailItem}>

                        <strong>
                          UPLOADED
                        </strong>

                        <span>
                          {new Date(
                            resume.created_at
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


                      <div style={styles.detailItem}>

                        <strong>
                          STATUS
                        </strong>

                        <span>
                          {resume.ai_analysis
                            ? "Analyzed"
                            : "Not Analyzed"}
                        </span>

                      </div>


                      <div style={styles.detailItem}>

                        <strong>
                          AI SCORE
                        </strong>

                        <span>
                          {score !== null
                            ? `${score}/100`
                            : "N/A"}
                        </span>

                      </div>

                    </div>


                    {/* ========================= */}
                    {/* STATUS */}
                    {/* ========================= */}

                    <div style={styles.status}>

                      {resume.ai_analysis ? (

                        <span
                          style={
                            styles.completedStatus
                          }
                        >
                          ✓ AI Analysis Available
                        </span>

                      ) : (

                        <span
                          style={
                            styles.pendingStatus
                          }
                        >
                          ⏳ Not Analyzed
                        </span>

                      )}

                    </div>


                    {/* ========================= */}
                    {/* ACTIONS */}
                    {/* ========================= */}

                    <div style={styles.actions}>

                      <button
                        onClick={() =>
                          handleAnalyze(
                            resume.id
                          )
                        }
                        disabled={
                          isAnalyzing ||
                          isDeleting
                        }
                        style={{
                          ...styles.viewButton,
                          opacity:
                            isAnalyzing ||
                            isDeleting
                              ? 0.6
                              : 1,
                        }}
                      >
                        {isAnalyzing
                          ? "Analyzing..."
                          : resume.ai_analysis
                          ? "Analyze Again"
                          : "Analyze Resume"}
                      </button>


                      <button
                        onClick={() =>
                          handleDelete(
                            resume.id
                          )
                        }
                        disabled={
                          isDeleting ||
                          isAnalyzing
                        }
                        style={{
                          ...styles.deleteButton,
                          opacity:
                            isDeleting ||
                            isAnalyzing
                              ? 0.6
                              : 1,
                        }}
                      >
                        {isDeleting
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>


                    {/* ========================= */}
                    {/* VIEW ANALYSIS */}
                    {/* ========================= */}

                    {resume.ai_analysis && (

                      <details
                        style={
                          styles.analysisDetails
                        }
                      >

                        <summary
                          style={
                            styles.analysisSummary
                          }
                        >
                          👁️ View Analysis
                        </summary>

                        <div
                          style={
                            styles.analysisContent
                          }
                        >
                          {resume.ai_analysis}
                        </div>

                      </details>

                    )}

                  </div>

                );
              })}

            </div>

          </div>

        )}

      </div>

    </div>
  );
}


// =========================
// INLINE STYLES
// =========================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 24px 60px",
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
  },

  loadingCard: {
    textAlign: "center",
  },

  spinner: {
    width: "35px",
    height: "35px",
    margin: "0 auto 15px",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #111827",
    borderRadius: "50%",
    animation:
      "resumeHistorySpin 0.8s linear infinite",
  },

  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "30px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },

  eyebrow: {
    display: "block",
    marginBottom: "8px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    color: "#6b7280",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  },

  newResumeButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  message: {
    marginBottom: "20px",
    padding: "14px 16px",
    borderRadius: "10px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    fontSize: "14px",
  },

  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "55px 30px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },

  primaryButton: {
    marginTop: "20px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },

  historyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "30px",
  },

  historyHeader: {
    marginBottom: "22px",
  },

  historyTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
  },

  historySubtitle: {
    margin: "7px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  },

  resumeItem: {
    padding: "22px 0",
    borderTop: "1px solid #e5e7eb",
  },

  resumeTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  resumeFile: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },

  fileIcon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "#f3f4f6",
    borderRadius: "10px",
    fontSize: "23px",
  },

  typeLabel: {
    display: "block",
    marginBottom: "4px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.07em",
    color: "#6b7280",
  },

  fileName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
    wordBreak: "break-word",
  },

  resumeScore: {
    flexShrink: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "20px",
    marginTop: "20px",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  detailItemLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
  },

  detailItemValue: {
    fontSize: "14px",
    color: "#111827",
  },

  status: {
    marginTop: "18px",
  },

  completedStatus: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: "7px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "12px",
    fontWeight: "600",
  },

  pendingStatus: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: "7px",
    background: "#fff7ed",
    color: "#c2410c",
    fontSize: "12px",
    fontWeight: "600",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
  },

  viewButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  deleteButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "10px 16px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  analysisDetails: {
    marginTop: "20px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "16px",
  },

  analysisSummary: {
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },

  analysisContent: {
    marginTop: "15px",
    padding: "18px",
    background: "#f9fafb",
    borderRadius: "10px",
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
    fontSize: "14px",
    color: "#4b5563",
    maxHeight: "400px",
    overflowY: "auto",
  },

};

export default ResumeHistory;
import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchDashboard = async () => {
      console.log("NEW DASHBOARD CODE IS RUNNING");
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // ==========================================
      // GET PROFILE
      // ==========================================

      try {
        const profileResponse = await axios.get(
          "http://127.0.0.1:8000/api/accounts/profile/",
          { headers }
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

      // ==========================================
      // GET INTERVIEW HISTORY
      // ==========================================

      try {
        const interviewResponse = await axios.get(
          "http://127.0.0.1:8000/api/interviews/history/",
          { headers }
        );

        console.log(
          "INTERVIEW HISTORY:",
          interviewResponse.data
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
    };

    fetchDashboard();
  }, []);

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  if (error) {
    return <h2>{error}</h2>;
  }

  if (!profile) {
    return <h2>Loading...</h2>;
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  const completedInterviews = interviews.filter(
    (interview) => interview.has_result
  );
  const filteredInterviews = interviews.filter(
  (interview) => {
    const matchesSearch =
      interview.job_role
        .toLowerCase()
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
  const totalInterviews = interviews.length;

  const completedCount = completedInterviews.length;

  const averageScore =
    completedCount > 0
      ? Math.round(
          completedInterviews.reduce(
            (total, interview) =>
              total + Number(interview.score || 0),
            0
          ) / completedCount
        )
      : 0;

  const highestScore =
    completedCount > 0
      ? Math.max(
          ...completedInterviews.map(
            (interview) => Number(interview.score || 0)
          )
        )
      : 0;

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
  <div>
    <h1>Dashboard</h1>

    <button
      onClick={() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }}
    >
      Logout
    </button>

    <h2>Welcome, {profile.username}!</h2>

      <p>Email: {profile.email}</p>

      <p>First Name: {profile.first_name}</p>

      <p>Last Name: {profile.last_name}</p>

      <p>Target Role: {profile.target_role}</p>

      <p>
        Experience Level: {profile.experience_level}
      </p>

      <hr />

      {/* ========================================
          INTERVIEW STATISTICS
      ======================================== */}

      <h2>Interview Statistics</h2>

      <p>
        <strong>Total Interviews:</strong>{" "}
        {totalInterviews}
      </p>

      <p>
        <strong>Completed Interviews:</strong>{" "}
        {completedCount}
      </p>

      <p>
        <strong>Average Score:</strong>{" "}
        {averageScore}/100
      </p>

      <p>
        <strong>Highest Score:</strong>{" "}
        {highestScore}/100
      </p>
      <p>
  <strong>Highest Score:</strong>{" "}
  {highestScore}/100
</p>

<h2>Progress</h2>

<p>
  <strong>Latest Score:</strong>{" "}
  {completedCount > 0
    ? completedInterviews[
        completedInterviews.length - 1
      ].score
    : 0}
  /100
</p>

<p>
  <strong>Previous Score:</strong>{" "}
  {completedCount > 1
    ? completedInterviews[
        completedInterviews.length - 2
      ].score
    : "N/A"}
  {completedCount > 1 && "/100"}
</p>

<p>
  <strong>Improvement:</strong>{" "}
  {completedCount > 1
    ? `${
        Number(
          completedInterviews[
            completedInterviews.length - 1
          ].score
        ) -
        Number(
          completedInterviews[
            completedInterviews.length - 2
          ].score
        )
      } points`
    : "Complete at least 2 interviews"}
</p>

<hr />

      <hr />

      {/* ========================================
          INTERVIEW HISTORY
      ======================================== */}

      <h2>Interview History</h2>

      {interviews.length === 0 ? (
        <p>No interviews completed yet.</p>
      ) : (
        interviews.map((interview) => (
          <div key={interview.id}>
            <h3>{interview.job_role}</h3>

            <p>
              <strong>Experience:</strong>{" "}
              {interview.experience_level}
            </p>

            <p>
              <strong>Type:</strong>{" "}
              {interview.interview_type}
            </p>

            <p>
              <strong>Questions:</strong>{" "}
              {interview.number_of_questions}
            </p>

            <p>
              <strong>Score:</strong>{" "}
              {interview.has_result
                ? `${interview.score}/100`
                : "Not evaluated"}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(
                interview.created_at
              ).toLocaleDateString()}
            </p>

            {/* VIEW RESULT */}

            {interview.has_result && (
              <button
                onClick={() =>
                  (window.location.href =
                    `/interview/result?interview_id=${interview.id}`)
                }
              >
                View Result
              </button>
            )}

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;
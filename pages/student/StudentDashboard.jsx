import { useEffect, useState } from "react";
import "../../styles/student/StudentDashboard.css";

function StudentDashboard() {

  const [stats, setStats] = useState({
    current_projects: 0,
    completed_projects: 0,
    join_requests: 0
  });

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= DUMMY DATA =================

  useEffect(() => {

    const dummyData = {
      current_projects: 1,
      completed_projects: 13,
      join_requests: 18
    };

    const dummyCertificates = [
      "Student Collaboration Platform",
      "Face Attendance System",
      "Library Management System",
      "Online Examination System",
      "E-Commerce Web App",
      "Smart Traffic System",
      "Blockchain Voting System",
      "IoT Agriculture System",
      "AI Resume Analyzer",
      "Internship Portal",
      "College ERP System",
      "Chat Application",
      "Cloud File Storage System"
    ];

    setTimeout(() => {
      setStats(dummyData);
      setCertificates(dummyCertificates);
      setLoading(false);
    }, 1000);

  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="dashboard-container">

      <h1 className="dashboard-title">Welcome Student</h1>

      {/* ===== DASHBOARD CARDS ===== */}
      <div className="dashboard-grid">

        <div className="dashboard-card blue">
          <h3>Current Projects</h3>
          <p>{stats.current_projects}</p>
        </div>

        <div className="dashboard-card green">
          <h3>Completed Projects</h3>
          <p>{stats.completed_projects}</p>
        </div>

        <div className="dashboard-card purple">
          <h3>Join Requests</h3>
          <p>{stats.join_requests}</p>
        </div>

      </div>

      {/* ===== CERTIFICATE SECTION ===== */}
      <div className="certificate-section">
        <h2>Completed Project Certificates</h2>

        <div className="certificate-grid">
          {certificates.map((cert, index) => (
            <div key={index} className="certificate-card">
              <h4>{cert}</h4>
              <button className="download-btn">
                Download Certificate
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default StudentDashboard;
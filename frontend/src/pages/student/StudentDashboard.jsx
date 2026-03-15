import { useEffect, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import "../../styles/student/StudentDashboard.css";

function StudentDashboard() {

  const [stats, setStats] = useState({
    current_projects: 0,
    completed_projects: 0,
    join_requests: 0
  });

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get("/dashboard/student");

      setStats({
        current_projects: res.data.current_projects || 0,
        completed_projects: res.data.completed_projects || 0,
        join_requests: res.data.join_requests || 0
      });

      setCertificates(res.data.certificates || []);

    } catch (err) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (url) => {
    if (!url) {
      toast.error("Certificate not available");
      return;
    }
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      <h1 className="dashboard-title">Welcome Student</h1>

      {/* ===== DASHBOARD STATS ===== */}
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
          <h3>Pending Join Requests</h3>
          <p>{stats.join_requests}</p>
        </div>

      </div>

      {/* ===== CERTIFICATES ===== */}
      <div className="certificate-section">
        <h2>Completed Project Certificates</h2>

        {certificates.length === 0 ? (
          <p className="empty-state">
            No certificates available yet.
          </p>
        ) : (
          <div className="certificate-grid">
            {certificates.map(cert => (
              <div key={cert.project_id} className="certificate-card">
                <h4>{cert.project_title}</h4>
                <button
                  className="download-btn"
                  onClick={() => downloadCertificate(cert.certificate_url)}
                >
                  Download Certificate
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

export default StudentDashboard;
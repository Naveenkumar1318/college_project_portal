import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";

import "../../../styles/modules/admin/dashboard/admin-dashboard.css";

interface Stats {
  totalProjects: number;
  completedProjects: number;
  workingProjects: number;
}

const AdminDashboard = () => {

  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    completedProjects: 0,
    workingProjects: 0
  });

  // FETCH ADMIN STATS
  const fetchStats = async () => {
    try {

      const res = await API.get("/admin/dashboard/stats");
      setStats(res.data);

    } catch (err) {
      console.error("Admin stats error:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (

    <div className="admin-dashboard">

      <h2>Admin Dashboard</h2>

      {/* ===== STATS ===== */}

      <div className="admin-stats">

        <div className="admin-stat-card">
          <h4>Total Projects</h4>
          <span>{stats.totalProjects}</span>
        </div>

        <div className="admin-stat-card">
          <h4>Completed Projects</h4>
          <span>{stats.completedProjects}</span>
        </div>

        <div className="admin-stat-card">
          <h4>Current Working</h4>
          <span>{stats.workingProjects}</span>
        </div>

      </div>

      {/* ===== ACTION CARDS ===== */}

      <div className="admin-cards">

        <div
          className="admin-card"
          onClick={() => navigate("/admin/projects")}
        >
          <h3>Projects View</h3>
          <p>View all system projects</p>
        </div>

        <div
          className="admin-card"
          onClick={() => navigate("/admin/manage")}
        >
          <h3>Manage Projects</h3>
          <p>Approve / manage requests</p>
        </div>

      </div>

    </div>

  );

};

export default AdminDashboard;
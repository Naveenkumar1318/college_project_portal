import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";

import "../../../styles/modules/mentor/dashboard/mentor-dashboard.css";

interface Stats {
  mentoringProjects: number;
  completedProjects: number;
  activeStudents: number;
}

const MentorDashboard = () => {

  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats>({
    mentoringProjects: 0,
    completedProjects: 0,
    activeStudents: 0
  });

  // FETCH DASHBOARD
  const fetchStats = async () => {
    try {

      const res = await API.get("/mentor/profile/stats");
      setStats(res.data);

    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (

    <div className="mentor-dashboard">

      <h2>Mentor Dashboard</h2>

      {/* ===== STATS ===== */}

      <div className="mentor-stats">

        <div className="mentor-stat-card">
          <h4>Total Projects Worked</h4>
          <span>{stats.mentoringProjects}</span>
        </div>

        <div className="mentor-stat-card">
          <h4>Completed</h4>
          <span>{stats.completedProjects}</span>
        </div>

      </div>

      {/* ===== ACTION CARDS ===== */}

      <div className="mentor-cards">

        <div
          className="mentor-card"
          onClick={() => navigate("/mentor/projects")}
        >
          <h3>Projects</h3>
          <p>Projects you mentor</p>
        </div>

        <div
          className="mentor-card"
          onClick={() => navigate("/mentor/requests")}
        >
          <h3>Notifications</h3>
          <p>Mentor requests</p>
        </div>

      </div>

    </div>

  );

};

export default MentorDashboard;
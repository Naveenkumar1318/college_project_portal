import { useNavigate } from "react-router-dom";
import "../../../styles/modules/student/dashboard/student-dashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const stats = {
    ownProjects: 5,
    ownCompleted: 2,
    memberProjects: 8,
    memberCompleted: 3,
  };

  return (
    <div className="sd-container">
      <h1 className="sd-title">Student Dashboard</h1>

      {/* 🔥 TOP STATS */}
      <div className="sd-stats">

        <div className="sd-card">
          <p>My Projects</p>
          <h2>{stats.ownProjects}</h2>
        </div>

        <div className="sd-card">
          <p>Completed</p>
          <h2>{stats.ownCompleted}</h2>
        </div>

        <div className="sd-card">
          <p>Member Projects</p>
          <h2>{stats.memberProjects}</h2>
        </div>

        <div className="sd-card">
          <p>Completed</p>
          <h2>{stats.memberCompleted}</h2>
        </div>

      </div>

      {/* 🔥 ACTION CARDS */}
      <div className="sd-actions">

        <div
          className="sd-action-card"
          onClick={() => navigate("/student/my-projects")}
        >
          <h3>My Projects</h3>
          <p>View and manage your projects</p>
        </div>

        <div
          className="sd-action-card"
          onClick={() => navigate("/student/member-projects")}
        >
          <h3>Member Projects</h3>
          <p>Projects you joined</p>
        </div>

        <div
          className="sd-action-card"
          onClick={() => navigate("/student/notifications")}
        >
          <h3>Notifications</h3>
          <p>View updates and alerts</p>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
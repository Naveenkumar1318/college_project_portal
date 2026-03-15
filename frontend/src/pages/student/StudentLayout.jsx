import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import "../../styles/student/StudentLayout.css";

function StudentLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/student-login";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout-container">

      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div>
          <div className="sidebar-header">
            {!collapsed && <h2 className="sidebar-title">Student Panel</h2>}
            <button
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              ☰
            </button>
          </div>

          <nav className="sidebar-nav">
            <Link to="/student" className={isActive("/student") ? "active-link" : ""}>Dashboard</Link>
            <Link to="/student/create" className={isActive("/student/create") ? "active-link" : ""}>Create Project</Link>
            <Link to="/student/my-projects" className={isActive("/student/my-projects") ? "active-link" : ""}>My Projects</Link>
            <Link to="/student/search" className={isActive("/student/search") ? "active-link" : ""}>Search Projects</Link>
            <Link to="/student/profile" className={isActive("/student/profile") ? "active-link" : ""}>Profile</Link>
          </nav>
        </div>

        <button className="logout-btn" onClick={logout}>
          {!collapsed && "Logout"}
        </button>
      </div>

      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
}

export default StudentLayout;
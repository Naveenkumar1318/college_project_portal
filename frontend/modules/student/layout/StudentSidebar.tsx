import { useNavigate, useLocation } from "react-router-dom";
import "../../../styles/student-sidebar.css";

const StudentSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "Search Projects", path: "/student/projects/search" },
    { name: "Create Project", path: "/student/projects/create" },
    { name: "Profile", path: "/student/profile" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login/student");
  };

  return (
    <aside className="student-sidebar">
      <div className="student-sidebar__logo">Student Panel</div>

      <div className="student-sidebar__menu">
        {menu.map((item) => (
          <div
            key={item.path}
            className={`student-sidebar__item ${
              location.pathname === item.path
                ? "student-sidebar__item--active"
                : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.name}
          </div>
        ))}
      </div>

      <div
        className="student-sidebar__item student-sidebar__logout"
        onClick={handleLogout}
      >
        Logout
      </div>
    </aside>
  );
};

export default StudentSidebar;
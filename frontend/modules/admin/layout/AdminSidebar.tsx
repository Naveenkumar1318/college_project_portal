import { useNavigate, useLocation } from "react-router-dom";

import "../../../styles/modules/student/layout/student-sidebar.css";

const AdminSidebar = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Projects", path: "/admin/projects" },
    { name: "Completion Requests", path: "/admin/completion-requests" }

  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login/admin");
  };

  return (

    <aside className="student-sidebar">

      <div className="student-sidebar__logo">
        Admin Panel
      </div>

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

export default AdminSidebar;
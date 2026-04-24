import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

import "../../../styles/modules/student/layout/student-layout.css";

const AdminLayout = () => {
  return (
    <div className="student-layout">

      <aside className="student-layout__sidebar">
        <AdminSidebar />
      </aside>

      <main className="student-layout__content">
        <div className="student-layout__inner">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
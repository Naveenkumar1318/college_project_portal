import { Outlet } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import "../../../styles/modules/student/layout/student-layout.css";

const StudentLayout = () => {
  return (
    <div className="student-layout">
      <aside className="student-layout__sidebar">
        <StudentSidebar />
      </aside>

      <main className="student-layout__content">
        <div className="student-layout__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
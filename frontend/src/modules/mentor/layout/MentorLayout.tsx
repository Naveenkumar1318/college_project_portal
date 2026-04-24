import { Outlet } from "react-router-dom";
import MentorSidebar from "./MentorSidebar";

// reuse student layout css
import "../../../styles/modules/student/layout/student-layout.css";

const MentorLayout = () => {
  return (
    <div className="student-layout">
      <aside className="student-layout__sidebar">
        <MentorSidebar />
      </aside>

      <main className="student-layout__content">
        <div className="student-layout__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MentorLayout;
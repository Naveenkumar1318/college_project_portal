import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Layouts
import MainLayout from "../components/layout/MainLayout";
import StudentLayout from "../modules/student/layout/StudentLayout";

// Pages
import Home from "../pages/Home/Home";
import Register from "../pages/Auth/Register";
import Login from "../pages/Auth/Login";

// Student Module
import StudentDashboard from "../modules/student/dashboard/StudentDashboard";

import MyProjects from "../modules/student/projects/MyProjects";
import MemberProjects from "../modules/student/projects/MemberProjects";

import SearchProjects from "../modules/student/projects/SearchProjects";
import CreateProject from "../modules/student/projects/CreateProject";

import MyProjectDetails from "../modules/student/projects/MyProjectDetails/MyProjectDetails";
import MemberProjectsDetails from "../modules/student/projects/MemberProjectsDetails/MemberProjectsDetails";

import MyProjectCompleted from "../modules/student/projects/MyProjectCompleted";
import MemberProjectsCompleted from "../modules/student/projects/MemberProjectsCompleted";

import Notifications from "../modules/student/notifications/Notifications";

import StudentProfile from "../modules/student/profile/StudentProfile";
import ProfileEdit from "../modules/student/profile/components/ProfileEdit";


// ================= PROTECTED ROUTE =================
const ProtectedRoute = ({ children, role }: any) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login/student" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ================= ROUTES =================
const AppRoutes = () => {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />

      <Route
        path="/register"
        element={
          <MainLayout>
            <Register />
          </MainLayout>
        }
      />

      <Route
        path="/login/:role"
        element={
          <MainLayout>
            <Login />
          </MainLayout>
        }
      />

      {/* STUDENT */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        
        <Route path="my-projects" element={<MyProjects />} />
        <Route path="member-projects" element={<MemberProjects />} />
        
        <Route path="my-projects/:id" element={<MyProjectDetails />} />
        <Route path="member-projects/:id" element={<MemberProjectsDetails />} />

        <Route path="my-projects/:id/completed" element={<MyProjectCompleted />} />
        <Route path="member-projects/:id/completed" element={<MemberProjectsCompleted />} />

        <Route path="notifications" element={<Notifications />} />

        <Route path="projects/search" element={<SearchProjects />} />
        <Route path="projects/create" element={<CreateProject />} />

        <Route path="profile" element={<StudentProfile />} />
        <Route path="profile/edit" element={<ProfileEdit />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
};

export default AppRoutes;
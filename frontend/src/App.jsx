import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import PageWrapper from "./components/PageWrapper";

/* ---------- Public Pages ---------- */

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";

/* ---------- Student Pages ---------- */

import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import CreateProject from "./pages/student/CreateProject";
import MyProjects from "./pages/student/MyProjects";
import SearchProjects from "./pages/student/SearchProjects";
import Profile from "./pages/student/Profile";

/* ---------- Project Chat ---------- */

import ProjectChat from "./components/project/ProjectChat";

/* ---------- Global Chat Styles ---------- */

import "./components/project/chat/styles/chat.css";


/* ================= ROUTES WITH PAGE ANIMATION ================= */

function AnimatedRoutes() {

  const location = useLocation();

  return (

    <AnimatePresence mode="wait">

      <Routes location={location} key={location.pathname}>

        {/* ================= PUBLIC ROUTES ================= */}

        <Route
          path="/"
          element={
            <>
              <Navbar />
              <PageWrapper>
                <Home />
              </PageWrapper>
            </>
          }
        />

        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <PageWrapper>
                <About />
              </PageWrapper>
            </>
          }
        />

        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <PageWrapper>
                <Register />
              </PageWrapper>
            </>
          }
        />

        {/* ================= LOGIN ROUTES ================= */}

        <Route
          path="/student-login"
          element={
            <>
              <Navbar />
              <PageWrapper>
                <Login role="Student" />
              </PageWrapper>
            </>
          }
        />

        <Route
          path="/staff-login"
          element={
            <>
              <Navbar />
              <PageWrapper>
                <Login role="Staff" />
              </PageWrapper>
            </>
          }
        />

        <Route
          path="/admin-login"
          element={
            <>
              <Navbar />
              <PageWrapper>
                <Login role="Admin" />
              </PageWrapper>
            </>
          }
        />

        {/* ================= STUDENT DASHBOARD ================= */}

        <Route path="/student" element={<StudentLayout />}>

          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="create" element={<CreateProject />} />
          <Route path="my-projects" element={<MyProjects />} />
          <Route path="search" element={<SearchProjects />} />
          <Route path="profile" element={<Profile />} />

          {/* ---------- PROJECT CHAT PAGE ---------- */}

          <Route
            path="projects/:projectId/chat"
            element={<ProjectChat />}
          />

        </Route>

      </Routes>

    </AnimatePresence>

  );
}


/* ================= MAIN APP ================= */

function App() {

  return (

    <Router>

      {/* Global Toast Notifications */}

      <Toaster
        position="top-right"
        containerStyle={{
          zIndex: 99999
        }}
        toastOptions={{
          style: {
            background: "#0b2e4f",
            color: "#ffffff",
            border: "1px solid rgba(0,212,255,0.3)"
          }
        }}
      />

      <AnimatedRoutes />

    </Router>

  );
}

export default App;
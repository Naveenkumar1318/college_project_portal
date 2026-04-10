import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../../../services/api";

import "../../../../styles/modules/student/projects/Member-Projects-Details/Member-Projects-Details.css";

import MembersTab from "./tabs/MembersTab";
import TasksTab from "./tabs/TasksTab";
import MentorTab from "./tabs/MentorTab";

const MemberProjectsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tab, setTab] = useState("members");

  // ================= FETCH =================
  const fetchProject = async () => {
    const res = await API.get(`/projects/${id}`);
    setProject(res.data);
  };

  const fetchMembers = async () => {
    const res = await API.get(`/projects/${id}/members`);
    setMembers(res.data.data);
  };

  useEffect(() => {
    fetchProject();
    fetchMembers();
  }, [id]);

  // ================= ACTION =================
 const leaveProject = async () => {

  const confirmLeave = window.confirm(
    "Are you sure you want to leave this project?"
  );

  if (!confirmLeave) return;

  try {

    await API.post(`/projects/${id}/leave`);

    alert("You left the project successfully");

    navigate("/student/member-projects");

  } catch (err) {
    console.error("Leave failed:", err);
    alert("Failed to leave project");
  }
};

  if (!project) return <p>Loading...</p>;

  return (
    <div className="pd-container">

      {/* BACK */}
      <button onClick={() => navigate(-1)}>← Back</button>

      {/* ================= PROJECT CARD ================= */}
      <div className="pd-glass">

        {/* HEADER */}
        <div className="pd-top">
          <h2>{project.title}</h2>

          <span
            className={`pd-status ${
              project.status === "active" ? "active" : "closed"
            }`}
          >
            {project.status === "active" ? "Open" : "Closed"}
          </span>
        </div>

        {/* DESCRIPTION */}
        <p className="pd-desc">{project.description}</p>

        {/* DETAILS */}
        <div className="pd-details">
          <p>
            <strong>Members:</strong>{" "}
            {project.members_count}/{project.required_members}
          </p>

          <p>
            <strong>Department:</strong>{" "}
            {project.departments?.join(", ") || "Not specified"}
          </p>

          <p>
            <strong>Expected Completion:</strong>{" "}
            {project.expected_completion || "Not set"}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="pd-actions">

          <div className="pd-btn-group">
            <button className="danger" onClick={leaveProject}>
              Leave Project
            </button>
          </div>

        </div>

      </div>

      {/* ================= TABS ================= */}
      <div className="pd-tabs">

        <button
          className={tab === "members" ? "active" : ""}
          onClick={() => setTab("members")}
        >
          Members
        </button>

        <button
          className={tab === "tasks" ? "active" : ""}
          onClick={() => setTab("tasks")}
        >
          Tasks
        </button>

        <button
          className={tab === "mentor" ? "active" : ""}
          onClick={() => setTab("mentor")}
        >
          Mentor
        </button>

      </div>

      {/* ================= CONTENT ================= */}
      <div className="pd-content">

        {tab === "members" && (
          <MembersTab
            members={members}
            navigate={navigate}
          />
        )}

        {tab === "tasks" && <TasksTab />}

        {tab === "mentor" && <MentorTab />}

      </div>

    </div>
  );
};

export default MemberProjectsDetails;
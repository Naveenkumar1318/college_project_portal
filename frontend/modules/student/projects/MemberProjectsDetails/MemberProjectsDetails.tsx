import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../../../services/api";
import "../../../../styles/Member-Projects-Details.css";

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
    await API.post(`/projects/${id}/leave`);
    navigate("/member-projects");
  };

  if (!project) return <p>Loading...</p>;

  return (
    <div className="pd-container">

      <button onClick={() => navigate(-1)}>← Back</button>

      {/* TOP CARD */}
      <div className="pd-glass">
        <div className="pd-top">
          <h2>{project.title}</h2>
          <span className="pd-status">
            {project.status === "active" ? "Open" : "Closed"}
          </span>
        </div>

        <p className="pd-desc">{project.description}</p>

        <p>
          Members: {project.members_count}/{project.required_members}
        </p>

        <button className="danger" onClick={leaveProject}>
          Leave Project
        </button>
      </div>

      {/* TABS */}
      <div className="pd-tabs">
        <button onClick={() => setTab("members")}>Members</button>
        <button onClick={() => setTab("tasks")}>Tasks</button>
        <button onClick={() => setTab("mentor")}>Mentor</button>
      </div>

      {/* CONTENT */}
      <div className="pd-content">

        {tab === "members" && (
          <MembersTab members={members} navigate={navigate} />
        )}

        {tab === "tasks" && <TasksTab />}
        {tab === "mentor" && <MentorTab />}

      </div>

    </div>
  );
};

export default MemberProjectsDetails;
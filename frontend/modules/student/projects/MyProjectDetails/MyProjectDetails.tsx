import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../../../services/api";
import "../../../../styles/My-project-details.css";

import RequestsTab from "./tabs/RequestsTab";
import MembersTab from "./tabs/MembersTab";
import TasksTab from "./tabs/TasksTab";
import MentorTab from "./tabs/MentorTab";

const MyProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // ================= FETCH =================
  const fetchProject = async () => {
    const res = await API.get(`/projects/${id}`);
    setProject(res.data);
  };

  const fetchRequests = async () => {
    const res = await API.get(`/projects/${id}/requests`);
    setRequests(res.data.data);
  };

  const fetchMembers = async () => {
    const res = await API.get(`/projects/${id}/members`);
    setMembers(res.data.data);
  };

  useEffect(() => {
    fetchProject();
    fetchRequests();
    fetchMembers();
  }, [id]);

  // ================= ACTIONS =================
  const accept = async (userId: string) => {
    await API.post(`/projects/${id}/accept/${userId}`);
    fetchRequests();
    fetchMembers();
  };

  const reject = async (userId: string) => {
    await API.post(`/projects/${id}/reject/${userId}`);
    fetchRequests();
  };

  const removeMember = async (userId: string) => {
    await API.post(`/projects/${id}/remove/${userId}`);
    fetchMembers();
  };

  const deleteProject = async () => {
    await API.delete(`/projects/${id}`);
    navigate("/my-projects");
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

        {project.is_owner && (
          <div className="pd-actions">
            <button>Edit</button>
            <button className="danger" onClick={deleteProject}>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="pd-tabs">
        <button onClick={() => setTab("requests")}>Requests</button>
        <button onClick={() => setTab("members")}>Members</button>
        <button onClick={() => setTab("tasks")}>Tasks</button>
        <button onClick={() => setTab("mentor")}>Mentor</button>
      </div>

      {/* CONTENT */}
      <div className="pd-content">

        {tab === "requests" && (
          <RequestsTab
            requests={requests}
            isOwner={project.is_owner}
            accept={accept}
            reject={reject}
            navigate={navigate}
          />
        )}

        {tab === "members" && (
          <MembersTab
            members={members}
            isOwner={project.is_owner}
            removeMember={removeMember}
            navigate={navigate}
          />
        )}

        {tab === "tasks" && <TasksTab />}
        {tab === "mentor" && <MentorTab />}

      </div>

    </div>
  );
};

export default MyProjectDetails;
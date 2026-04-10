import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../../../services/api";
import "../../../../styles/modules/student/projects/My-Project-Details/My-Project-Details.css";
import "../../../../styles/modules/student/projects/My-Project-Details/tabs/RequestsTab.css";
import "../../../../styles/modules/student/projects/My-Project-Details/tabs/MembersTab.css";

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
  const [loading, setLoading] = useState(true);

  // ================= FETCH =================
  const fetchAll = async () => {
    try {
      setLoading(true);

      const [p, r, m] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/projects/${id}/requests`),
        API.get(`/projects/${id}/members`)
      ]);

      setProject(p.data);
      setRequests(r.data.data);
      setMembers(m.data.data);

    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  // ================= ACTIONS =================

  const accept = async (userId: string) => {
    await API.post(`/projects/${id}/accept/${userId}`);
    fetchAll();
  };

  const reject = async (userId: string) => {
    await API.post(`/projects/${id}/reject/${userId}`);
    fetchAll();
  };

  const removeMember = async (userId: string) => {
    const confirmRemove = window.confirm("Remove this member?");
    if (!confirmRemove) return;

    await API.post(`/projects/${id}/remove/${userId}`);
    fetchAll();
  };

  // 🔴 DELETE PROJECT
  const deleteProject = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project? This will remove all members."
    );

    if (!confirmDelete) return;

    await API.delete(`/projects/${id}`);
    navigate("/student/my-projects");
  };

  // 🔴 TOGGLE OPEN / CLOSED
  const toggleStatus = async () => {
    let newStatus = "active";

    if (project.status === "active") {
      newStatus = "closed";
    } else if (project.status === "closed") {
      newStatus = "active";
    }

    await API.put(`/projects/${id}/status?status=${newStatus}`);
    fetchAll();
  };

  // 🔴 MARK COMPLETED
  const completeProject = async () => {
    const confirmComplete = window.confirm(
      "Mark this project as completed?"
    );

    if (!confirmComplete) return;

    await API.put(`/projects/${id}/status?status=completed`);
    navigate(`/student/my-projects/${id}/completed`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="pd-container">

     <button className="pd-back-btn" onClick={() => navigate(-1)}>
  ← Back
</button>

      {/* ================= TOP CARD ================= */}
      <div className="pd-glass">

        <div className="pd-top">
          <h2>{project.title}</h2>

          <span className={`pd-status ${project.status}`}>
            {project.status === "active"
              ? "Open"
              : project.status === "closed"
              ? "Closed"
              : "Completed"}
          </span>
        </div>

        <p className="pd-desc">{project.description}</p>

        {/* DETAILS */}
        <div className="pd-details">
          <p><strong>Members:</strong> {project.members_count}/{project.required_members}</p>
          <p><strong>Department:</strong> {project.departments?.join(", ") || "All"}</p>
          <p><strong>Expected Completion:</strong> {project.expected_completion || "N/A"}</p>
        </div>

        {/* ================= OWNER ACTIONS ================= */}
        {project.is_owner && project.status !== "completed" && (
          <div className="pd-actions">

  {/* TOP → TOGGLE */}
  <div className="pd-toggle">
  <span
    className={project.status === "active" ? "active" : ""}
    onClick={() => project.status !== "active" && toggleStatus()}
  >
    Open
  </span>

  <span
    className={project.status === "closed" ? "active" : ""}
    onClick={() => project.status !== "closed" && toggleStatus()}
  >
    Closed
  </span>
</div>

  {/* BOTTOM → BUTTONS */}
  <div className="pd-btn-group">
    <button onClick={() => navigate(`/student/projects/edit/${id}`)}>
      Edit
    </button>

    <button className="danger" onClick={deleteProject}>
      Delete
    </button>

    <button onClick={completeProject}>
      Complete Project
    </button>
  </div>

</div>
        )}

      </div>

      {/* ================= TABS ================= */}
      {project.status !== "completed" && (
        <>
          <div className="pd-tabs">
  <button
    className={tab === "requests" ? "active" : ""}
    onClick={() => setTab("requests")}
  >
    Requests
  </button>

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
            {tab === "mentor" && (
  <MentorTab
    projectId={project.id}
    isOwner={project.is_owner}
  />
)}

          </div>
        </>
      )}

    </div>
  );
};

export default MyProjectDetails;
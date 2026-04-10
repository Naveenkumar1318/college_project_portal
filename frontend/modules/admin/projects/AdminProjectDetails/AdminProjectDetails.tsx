import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../../../services/api";

import "../../../../styles/modules/admin/projects/AdminProjectDetails/AdminProjectDetails.css";

import MembersTab from "../tabs/MembersTab";
import MentorTab from "../tabs/MentorTab";
import TasksTab from "../tabs/TasksTab";

type TabType = "members" | "mentor" | "tasks";

const AdminProjectDetails = () => {

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [mentor, setMentor] = useState<any | null>(null);
  const [tab, setTab] = useState<TabType>("members");
  const [loading, setLoading] = useState(true);

  // ================= FETCH PROJECT =================
  const fetchProject = async () => {

    try {

      setLoading(true);

      const res = await API.get(`/admin/projects/${id}`);

      setProject(res.data?.project || null);
      setMembers(res.data?.members || []);
      setMentor(res.data?.mentor || null);

    } catch (err) {

      console.error("Admin project fetch error:", err);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (id) {
      fetchProject();
    }

  }, [id]);

  if (loading) {
    return <p>Loading project...</p>;
  }

  if (!project) {
    return <p>Project not found</p>;
  }

  return (

    <div className="apd-container">

      {/* BACK */}
      <button onClick={() => navigate(-1)}>← Back</button>

      {/* ================= PROJECT CARD ================= */}

      <div className="apd-glass">

        {/* HEADER */}
        <div className="apd-top">

          <h2>{project.title}</h2>

         <span className={`apd-status ${project.status}`}>
  {project.status === "active" && "Open"}
  {project.status === "closed" && "Closed"}
  {project.status === "completed" && "Completed"}
</span>

        </div>

        {/* DESCRIPTION */}
        <p className="apd-desc">{project.description}</p>

        {/* DETAILS */}
        <div className="apd-details">

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

      </div>

      {/* ================= TABS ================= */}

      <div className="apd-tabs">

        <button
          className={tab === "members" ? "active" : ""}
          onClick={() => setTab("members")}
        >
          Members
        </button>

        <button
          className={tab === "mentor" ? "active" : ""}
          onClick={() => setTab("mentor")}
        >
          Mentor
        </button>

        <button
          className={tab === "tasks" ? "active" : ""}
          onClick={() => setTab("tasks")}
        >
          Tasks
        </button>

      </div>

      {/* ================= CONTENT ================= */}

      <div className="apd-content">

        {tab === "members" && (
          <MembersTab
            members={members}
            navigate={navigate}
          />
        )}

        {tab === "mentor" && (
          <MentorTab
            mentor={mentor}
            navigate={navigate}
          />
        )}

        {tab === "tasks" && id && (
          <TasksTab projectId={Number(id)} />
        )}

      </div>

    </div>

  );

};

export default AdminProjectDetails;
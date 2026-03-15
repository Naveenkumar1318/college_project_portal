import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

import {
  getOwnProjects,
  getWorkProjects,
  getProjectDetail,
  updateProjectStatus,
  removeMember,
  deleteProject,
  completeProject
} from "../../services/projectApi";

import API from "../../services/api";
import "../../styles/student/MyProjects.css";

import ProjectChat from "../../components/project/ProjectChat";
import TaskBoard from "../../components/project/TaskBoard";
import Milestones from "../../components/project/Milestones";

function MyProjects() {

/* ================= USER ID FROM TOKEN ================= */

const token = localStorage.getItem("token");
let userId = null;

if (token) {
  try {
    const decoded = jwtDecode(token);
    userId = decoded.user_id;
  } catch {
    console.error("Invalid token");
  }
}

/* ================= STATE ================= */

const [activeSection, setActiveSection] = useState(null);
const [projects, setProjects] = useState([]);
const [selectedProject, setSelectedProject] = useState(null);
const [activeTab, setActiveTab] = useState("members");
const [mentors, setMentors] = useState([]);

/* ================= LOAD PROJECTS ================= */

useEffect(() => {
  if (!activeSection) return;
  loadProjects();
}, [activeSection]);

const loadProjects = async () => {
  try {

    let data;

    if (activeSection.includes("own")) {
      data = await getOwnProjects();
    } else {
      data = await getWorkProjects();
    }

    const filtered = data.filter(p =>
      activeSection.includes("completed")
        ? p.status === "COMPLETED"
        : p.status !== "COMPLETED"
    );

    setProjects(filtered);

  } catch {
    toast.error("Failed to load projects");
  }
};

/* ================= OPEN PROJECT ================= */

const openProject = async (id) => {
  try {

    const data = await getProjectDetail(id);

    setSelectedProject(data);
    setActiveTab("members");

  } catch {
    toast.error("Failed to load project");
  }
};

/* ================= PROJECT ACTIONS ================= */

const changeStatus = async (status) => {
  try {
    await updateProjectStatus(selectedProject.id, status);
    openProject(selectedProject.id);
  } catch {
    toast.error("Status update failed");
  }
};

const handleRemove = async (memberId) => {
  try {
    await removeMember(selectedProject.id, memberId);
    openProject(selectedProject.id);
  } catch {
    toast.error("Failed to remove member");
  }
};

const handleDelete = async () => {
  try {
    await deleteProject(selectedProject.id);
    toast.success("Project deleted");
    setSelectedProject(null);
    loadProjects();
  } catch {
    toast.error("Delete failed");
  }
};

const handleComplete = async () => {
  try {
    await completeProject(selectedProject.id);
    toast.success("Project completed");
    openProject(selectedProject.id);
  } catch {
    toast.error("Completion failed");
  }
};

const handleAccept = async (studentId) => {
  try {
    await API.post(`/projects/${selectedProject.id}/accept/${studentId}`);
    toast.success("Request accepted");
    openProject(selectedProject.id);
  } catch {
    toast.error("Accept failed");
  }
};

const handleReject = async (studentId) => {
  try {
    await API.delete(`/projects/${selectedProject.id}/remove/${studentId}`);
    toast.success("Request rejected");
    openProject(selectedProject.id);
  } catch {
    toast.error("Reject failed");
  }
};

/* ================= MENTORS ================= */

const loadMentors = async () => {
  try {
    const res = await API.get("/mentors");
    setMentors(res.data);
  } catch {
    toast.error("Failed to load mentors");
  }
};

useEffect(() => {
  if (activeTab === "mentor") loadMentors();
}, [activeTab]);

const requestMentor = async (id) => {
  try {
    await API.post(`/projects/${selectedProject.id}/mentor-request/${id}`);
    toast.success("Mentor requested");
    openProject(selectedProject.id);
  } catch {
    toast.error("Failed to request mentor");
  }
};

/* ================= DETAIL PAGE ================= */

if (selectedProject) {

const isOwner = selectedProject.created_by === userId;
const isCompleted = selectedProject.status === "COMPLETED";

return (

<div className="project-detail-page">

<button className="back-btn" onClick={()=>setSelectedProject(null)}>
← Back
</button>

{/* PROJECT HEADER */}

<div className="project-detail-card">

<div className="project-header">

<div>
<h2>{selectedProject.title}</h2>
<p className="project-description">{selectedProject.description}</p>
</div>

<span className={`status ${selectedProject.status}`}>
{selectedProject.status}
</span>

</div>

<div className="project-meta">

<span>
👥 {selectedProject.members?.length}/{selectedProject.team_limit}
</span>

<span>
🎓 {selectedProject.mentor_name || "No Mentor"}
</span>

</div>

{/* STATUS TOGGLE */}

{isOwner && !isCompleted && (

<div className="status-toggle">

<button
className={selectedProject.status==="OPEN"?"active":""}
onClick={()=>changeStatus("OPEN")}
>
Open
</button>

<button
className={selectedProject.status==="IN_PROGRESS"?"active":""}
onClick={()=>changeStatus("IN_PROGRESS")}
>
In Progress
</button>

</div>

)}

{/* ACTIONS */}

<div className="project-actions">

<button className="view-btn">View</button>

{isOwner && !isCompleted && (

<>
<button className="edit-btn">Edit</button>
<button className="danger-btn" onClick={handleDelete}>Delete</button>
<button className="complete-btn" onClick={handleComplete}>Complete</button>
</>

)}

{isCompleted && (
<button className="certificate-btn">
Download Certificate
</button>
)}

</div>

</div>

{/* ================= TABS ================= */}

{!isCompleted && (

<>

<div className="tab-row">

<button className={activeTab==="members"?"active-tab":""}
onClick={()=>setActiveTab("members")}>
Team Members
</button>

<button className={activeTab==="requests"?"active-tab":""}
onClick={()=>setActiveTab("requests")}>
Requests ({selectedProject.requests?.length||0})
</button>

<button className={activeTab==="mentor"?"active-tab":""}
onClick={()=>setActiveTab("mentor")}>
Search Mentor
</button>

<button className={activeTab==="chat"?"active-tab":""}
onClick={()=>setActiveTab("chat")}>
Chat
</button>

<button className={activeTab==="tasks"?"active-tab":""}
onClick={()=>setActiveTab("tasks")}>
Tasks
</button>

<button className={activeTab==="milestones"?"active-tab":""}
onClick={()=>setActiveTab("milestones")}>
Milestones
</button>

</div>

{/* MEMBERS */}

{activeTab==="members" && (
<div className="member-grid">
{selectedProject.members?.map(member=>(
<div key={member.id} className="member-card">

<img src={`http://localhost:8000${member.photo}`} />

<h4>{member.name}</h4>

<p>{member.register_number}</p>

<button className="view-btn">View Profile</button>

{isOwner && !member.is_owner && (
<button
className="danger-btn"
onClick={()=>handleRemove(member.id)}
>
Remove
</button>
)}

</div>
))}
</div>
)}

{/* REQUESTS */}

{activeTab==="requests" && (
<div className="member-grid">

{selectedProject.requests?.map(req=>(
<div key={req.id} className="member-card">

<img src={`http://localhost:8000${req.photo}`} />

<h4>{req.name}</h4>

<p>{req.register_number}</p>

<button className="view-btn">View Profile</button>

{isOwner && (
<>
<button
className="complete-btn"
onClick={()=>handleAccept(req.id)}
>
Accept
</button>

<button
className="danger-btn"
onClick={()=>handleReject(req.id)}
>
Reject
</button>
</>
)}

</div>
))}

</div>
)}

{/* MENTOR */}

{activeTab==="mentor" && (
<div className="mentor-grid">

{mentors.map(m=>(
<div key={m.id} className="mentor-card">

<img src={`http://localhost:8000${m.profile_image}`} />

<h4>{m.name}</h4>

<p>{m.department}</p>

<button className="view-btn">View Profile</button>

{isOwner && (
<button
className="complete-btn"
onClick={()=>requestMentor(m.id)}
>
Send Request
</button>
)}

</div>
))}

</div>
)}

{/* CHAT */}

{activeTab==="chat" && (
<ProjectChat
projectId={selectedProject.id}
userId={userId}
/>
)}

{/* TASKS */}

{activeTab==="tasks" && (
<TaskBoard projectId={selectedProject.id} />
)}

{/* MILESTONES */}

{activeTab==="milestones" && (
<Milestones projectId={selectedProject.id} />
)}

</>

)}

</div>

);

}

/* ================= MAIN PAGE ================= */

const sections = [
{ key:"own-current",label:"Student Own Projects" },
{ key:"own-completed",label:"Student Completed Projects (Owner)" },
{ key:"work-current",label:"Student Projects as Member" },
{ key:"work-completed",label:"Student Completed Projects (Member)" }
];

return(

<div className="myprojects-container">

<h2 className="page-title">My Projects</h2>

<div className="dashboard-grid">

{sections.map(sec=>(
<div
key={sec.key}
className={`dashboard-card ${activeSection===sec.key?"active":""}`}
onClick={()=>setActiveSection(prev=>prev===sec.key?null:sec.key)}
>

<h3>{sec.label}</h3>

<span>
{activeSection===sec.key?projects.length:0}
</span>

</div>
))}

</div>

{activeSection &&(

<div className="project-grid">

{projects.map(project=>(
<div
key={project.id}
className="project-card-premium"
onClick={()=>openProject(project.id)}
>

<div className="project-header">

<h3>{project.title}</h3>

<span className={`status ${project.status}`}>
{project.status}
</span>

</div>

<p className="project-desc">
{project.description}
</p>

<div className="project-meta">

👥 {project.team_count}/{project.team_limit}

<span>
🎓 {project.mentor_name || "No Mentor"}
</span>

</div>

</div>
))}

</div>

)}

</div>

);

}

export default MyProjects;
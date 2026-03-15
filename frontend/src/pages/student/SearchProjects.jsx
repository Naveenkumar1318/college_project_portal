import { useEffect, useState } from "react";
import { FaUsers, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import API from "../../services/api";
import toast from "react-hot-toast";
import "../../styles/student/SearchProjects.css";

function SearchProjects() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects/search");
      setProjects(res.data || []);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (project) => {
    try {
      setActionLoading(project.id);
      await API.post(`/projects/${project.id}/request`);
      toast.success("Request sent successfully");
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Request failed");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelRequest = async (projectId) => {
    try {
      setActionLoading(projectId);
      await API.delete(`/projects/${projectId}/request`);
      toast.success("Request cancelled");
      fetchProjects();
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p className="loading">Loading projects...</p>;

  const filtered =
    activeTab === "OPEN"
      ? projects.filter(p => p.status === "OPEN")
      : projects.filter(p => p.status === "IN_PROGRESS");

  return (
    <div className="search-container">
      <h1 className="page-title">Search Projects</h1>

      <div className="tab-switch">
        <button
          className={activeTab === "OPEN" ? "active" : ""}
          onClick={() => setActiveTab("OPEN")}
        >
          Open Projects
        </button>
        <button
          className={activeTab === "WORKING" ? "active" : ""}
          onClick={() => setActiveTab("WORKING")}
        >
          Working Projects
        </button>
      </div>

      <div className="grid">
        {filtered.map(project => {
          const vacancy = project.team_limit - project.current_members;
          const requestStatus = project.user_request_status || "NONE";
          const isOpen = project.status === "OPEN";

          return (
            <div key={project.id} className="project-card">

              {/* Title & Status */}
              <div className="card-top">
                <h2 className="project-title">{project.title}</h2>
                <span className={`status-badge ${isOpen ? "open" : "closed"}`}>
                  {isOpen ? "Open" : "Closed"}
                </span>
              </div>

              {/* Owner Section */}
              <div className="owner-section">
                <img
                  src={project.owner_image || "/default-avatar.png"}
                  alt="owner"
                  className="owner-avatar"
                />
                <div className="owner-info">
                  <p><strong>Name:</strong> {project.owner_name}</p>
                  <p><strong>Reg No:</strong> {project.owner_register_number}</p>
                  <p><strong>Department:</strong> {project.owner_department}</p>
                  <p><strong>Year:</strong> {project.owner_year}</p>
                </div>
              </div>

              {/* Team */}
              <div className="team-row">
                <FaUsers className="team-icon" />
                <span>
                  Team ({project.current_members}/{project.team_limit})
                </span>
              </div>

              {/* Required Department */}
              <p className="required-dept">
                Required Department:{" "}
                {project.required_departments?.join(", ") || "All"}
              </p>

              {/* Vacancy */}
              <div className={`vacancy ${vacancy > 0 ? "available" : "full"}`}>
                {vacancy > 0 ? (
                  <>
                    <FaCheckCircle /> {vacancy} Vacancy Available
                  </>
                ) : (
                  <>
                    <FaTimesCircle /> Team Full
                  </>
                )}
              </div>

              {/* Buttons */}
              {requestStatus === "NONE" && vacancy > 0 && (
                <button
                  className="join-btn"
                  onClick={() => sendRequest(project)}
                  disabled={actionLoading === project.id}
                >
                  {actionLoading === project.id ? "Sending..." : "Request to Join"}
                </button>
              )}

              {requestStatus === "WAITING" && (
                <button
                  className="cancel-btn"
                  onClick={() => cancelRequest(project.id)}
                  disabled={actionLoading === project.id}
                >
                  Cancel Request
                </button>
              )}

              {requestStatus === "ACCEPTED" && (
                <div className="request-status accepted">Accepted</div>
              )}

              {requestStatus === "REJECTED" && (
                <div className="request-status rejected">Rejected</div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SearchProjects;
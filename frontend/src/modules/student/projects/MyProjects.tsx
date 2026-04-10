import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import { getDeptLabel } from "../../../utils/departments";
import "../../../styles/modules/student/projects/my-projects.css";

const MyProjects = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"working" | "completed">("working");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH PROJECTS =================
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const res = await API.get("/projects/search", {
        params: {
          status: tab === "working" ? "all" : "completed",
        },
      });

      const myProjects = res.data.data.filter((p: any) => p.is_owner);
      setProjects(myProjects);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [tab]);

  // ================= FILTER =================
  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const getFullUrl = (path: string) => {
    if (!path) return "/default-avatar.png";
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `http://localhost:8000/${clean}`;
  };

  return (
    <div className="mp-container">

      {/* BACK */}
      <button className="mp-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1>My Projects</h1>

      {/* ================= TOP BAR ================= */}
      <div className="mp-topbar">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mp-search"
        />

        <div className="mp-tab-toggle">
          <button
            className={tab === "working" ? "active" : ""}
            onClick={() => setTab("working")}
          >
            Working
          </button>

          <button
            className={tab === "completed" ? "active" : ""}
            onClick={() => setTab("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}

      {loading ? (
        <p>Loading projects...</p>
      ) : filtered.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <div className="mp-grid">
          {filtered.map((p) => (
            <div key={p.id} className="mp-card glass">

              {/* HEADER */}
              <div className="mp-header">
                <div className="mp-owner">
                  <img
                    src={getFullUrl(p.owner?.image)}
                    alt="owner"
                    className="mp-avatar"
                  />
                  <div>
                    <p className="owner-name">{p.owner?.name}</p>
                    <p className="owner-role">Owner</p>
                  </div>
                </div>

                <span className={`status ${p.status}`}>
                  {p.status === "active"
                    ? "Open"
                    : p.status === "closed"
                    ? "Closed"
                    : "Completed"}
                </span>
              </div>

              {/* TITLE */}
              <h2 className="mp-title">{p.title}</h2>
              <p className="mp-desc">{p.description}</p>

              {/* DETAILS */}
              <div className="mp-details">

                <div className="mp-row">
                  <span className="label">Department</span>
                  <span className="value">
                    {getDeptLabel(p.owner?.department)}
                  </span>
                </div>

                <div className="mp-row">
                  <span className="label">Required</span>
                  <span className="value wrap">
                    {p.departments?.length
                      ? p.departments.map(getDeptLabel).join(", ")
                      : "All"}
                  </span>
                </div>

                <div className="mp-row">
                  <span className="label">Members</span>
                  <span className="value">
                    {p.members_count}/{p.required_members}
                  </span>
                </div>

              </div>

              {/* BUTTON */}
              <button
                className="mp-btn"
                onClick={() =>
                  navigate(
                    p.status === "completed"
                      ? `/student/my-projects/${p.id}/completed`
                      : `/student/my-projects/${p.id}`
                  )
                }
              >
                {p.status === "completed"
                  ? "View Completed"
                  : "Your Project"}
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyProjects;
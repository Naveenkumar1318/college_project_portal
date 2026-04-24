import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import "../../../styles/modules/admin/projects/AdminProjects.css";

const AdminProjects = () => {

  const navigate = useNavigate();

  const [tab, setTab] = useState<"working" | "completed">("working");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH PROJECTS =================
  const fetchProjects = async () => {
    try {

      setLoading(true);

      const res = await API.get("/admin/projects");
      setProjects(res.data.data);

    } catch (err) {

      console.error("FETCH ERROR:", err);
      setProjects([]);

    } finally {
      setLoading(false);
    }
  };

  // ================= EFFECT =================
  useEffect(() => {
    fetchProjects();
  }, [tab]);

  // ================= SEARCH FILTER =================
  const filteredProjects = projects
    .filter((p) =>
      tab === "working"
        ? p.status === "active"
        : p.status === "completed" || p.status === "closed"
    )
    .filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="ap-container">

      {/* BACK BUTTON */}
      <button
        className="ap-back"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* TITLE */}
      <h1>Admin Projects</h1>

      {/* TOP BAR */}
      <div className="ap-topbar">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ap-search"
        />

        {/* TAB TOGGLE */}
        <div className="ap-tab-toggle">

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

        <p className="ap-empty">Loading projects...</p>

      ) : filteredProjects.length === 0 ? (

        <p className="ap-empty">No projects found</p>

      ) : (

        <div className="ap-grid">

          {filteredProjects.map((p) => (

            <div key={p.id} className="ap-card">

              {/* HEADER */}
              <div className="ap-card-header">

                <div className="ap-owner">

                  <img
                    src={
                      p.owner?.image
                        ? `http://localhost:8000${p.owner.image}`
                        : "/default-avatar.png"
                    }
                    className="ap-avatar"
                  />

                  <span>{p.owner?.name || "Unknown"}</span>

                </div>

                <span className="ap-badge">
                  {p.status === "active" ? "Working" : "Completed"}
                </span>

              </div>

              {/* TITLE */}
              <h2 className="ap-title">{p.title}</h2>

              {/* DESCRIPTION */}
              <p className="ap-desc">
                {p.description?.slice(0, 120)}...
              </p>

              {/* DETAILS */}
              <div className="ap-details-grid">

                <div>
                  <span>Owner</span>
                  <p>{p.owner?.name}</p>
                </div>

                <div>
                  <span>Department</span>
                  <p>{p.owner?.department || "—"}</p>
                </div>

                <div>
                  <span>Members</span>
                  <p>{p.members_count}/{p.required_members}</p>
                </div>

              </div>

              {/* ACTION */}
              <button
                className="ap-btn"
                onClick={() =>
                  navigate(`/admin/projects/${p.id}`)
                }
              >
                View Project
              </button>

            </div>

          ))}

        </div>

      )}

    </div>
  );
};

export default AdminProjects;
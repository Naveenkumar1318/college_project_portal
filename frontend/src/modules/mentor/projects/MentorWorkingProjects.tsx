import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import "../../../styles/modules/mentor/projects/Mentor-Working-Projects.css";

const MentorWorkingProjects = () => {

  const navigate = useNavigate();

  const [tab, setTab] = useState<"working" | "completed">("working");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH PROJECTS =================
  const fetchProjects = async () => {
    try {

      setLoading(true);

      const res = await API.get("/mentor/projects");
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
    <div className="mp-container">

      {/* BACK BUTTON */}
      <button
        className="mp-back"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* TITLE */}
      <h1>Mentor Projects</h1>

      {/* TOP BAR */}
      <div className="mp-topbar">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mp-search"
        />

        {/* TAB TOGGLE */}
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

        <p className="mp-empty">Loading projects...</p>

      ) : filteredProjects.length === 0 ? (

        <p className="mp-empty">No mentor projects found</p>

      ) : (

        <div className="mp-grid">

          {filteredProjects.map((p) => (

            <div key={p.id} className="mp-card">

              {/* HEADER */}
              <div className="mp-card-header">

                <div className="mp-owner">

                  <img
                    src={
                      p.owner?.image
                        ? `http://localhost:8000${p.owner.image}`
                        : "/default-avatar.png"
                    }
                    className="mp-avatar"
                  />

                  <span>{p.owner?.name || "Unknown"}</span>

                </div>

                <span className="mp-badge">
                  {p.status === "active" ? "Working" : "Completed"}
                </span>

              </div>

              {/* TITLE */}
              <h2 className="mp-title">{p.title}</h2>

              {/* DESCRIPTION */}
              <p className="mp-desc">
                {p.description?.slice(0, 120)}...
              </p>

              {/* DETAILS */}
              <div className="mp-details-grid">

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
                className="mp-btn"
                onClick={() =>
                  navigate(`/mentor/projects/${p.id}`)
                }
              >
                View Mentor Project
              </button>

            </div>

          ))}

        </div>

      )}

    </div>
  );
};

export default MentorWorkingProjects;
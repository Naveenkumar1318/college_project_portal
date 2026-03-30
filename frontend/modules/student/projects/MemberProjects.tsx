import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import "../../../styles/member-projects.css";

const MemberProjects = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"working" | "completed">("working");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH =================
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const res = await API.get("/projects/search", {
        params: {
          status: tab === "working" ? "open" : "closed"
        }
      });

      // 🔥 ONLY MEMBER PROJECTS
      const memberProjects = res.data.data.filter(
        (p: any) =>
          !p.is_owner && p.join_status === "accepted"
      );

      setProjects(memberProjects);

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

  // ================= FILTER =================
  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mp-container">

      {/* BACK */}
      <button className="mp-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1>Member Projects</h1>

      {/* TOP BAR */}
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
        <p>No member projects found</p>
      ) : (
        <div className="mp-grid">
          {filtered.map((p) => (
            <div key={p.id} className="mp-card">

              {/* HEADER */}
              <div className="mp-card-header">
                <div className="mp-owner">
                  <span className="mp-avatar">👤</span>
                  <span>{p.owner?.name}</span>
                </div>

                <span className="mp-badge">
                  {p.status === "active" ? "Open" : "Closed"}
                </span>
              </div>

              {/* CONTENT */}
              <h2 className="mp-title">{p.title}</h2>
              <p className="mp-desc">{p.description}</p>

              {/* DETAILS */}
              <div className="mp-details-grid">
                <div>
                  <span>Owner Name</span>
                  <p>{p.owner?.name}</p>
                </div>

                <div>
                  <span>Department</span>
                  <p>{p.owner?.department}</p>
                </div>

                <div>
                  <span>Members</span>
                  <p>{p.members_count}/{p.required_members}</p>
                </div>
              </div>

              {/* BUTTON */}
              <button
                className="mp-btn"
                onClick={() =>
                  navigate(
                    p.status === "active"
                      ? `/student/member-projects/${p.id}`
                      : `/student/member-projects/${p.id}/completed`
                  )
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

export default MemberProjects;
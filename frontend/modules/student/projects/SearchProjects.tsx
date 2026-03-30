import { useEffect, useState } from "react";
import api from "../../../services/api";
import "../../../styles/search-projects.css";

const departments = ["All", "CSE", "IT", "MCA"];

const SearchProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("open");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/search", {
        params: { q: query, department: dept, status }
      });
      setProjects(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [query, dept, status]);

  const join = async (id: number) => {
    try {
      setLoadingId(id);
      await api.post(`/projects/${id}/join`);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to apply");
    } finally {
      setLoadingId(null);
    }
  };

  const cancel = async (id: number) => {
    try {
      setLoadingId(id);
      await api.post(`/projects/${id}/cancel`);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to cancel");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="sp-container">
      <h1 className="sp-title">Search Projects</h1>

      <div className="sp-topbar">
        <input
          className="sp-search"
          placeholder="Search projects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="sp-select"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <div className="sp-toggle">
          <div
            className={`toggle-btn ${status === "open" ? "active" : ""}`}
            onClick={() => setStatus("open")}
          >
            Open
          </div>
          <div
            className={`toggle-btn ${status === "closed" ? "active" : ""}`}
            onClick={() => setStatus("closed")}
          >
            Closed
          </div>
        </div>
      </div>

      <div className="sp-grid">
        {projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          projects.map((p) => {
            const isFull =
              p.members_count >= p.required_members;

            return (
              <div key={p.id} className="sp-card">
                <div className="sp-header">
                  <img
                    src={p.owner?.image || "/default-avatar.png"}
                    alt="owner"
                  />

                  <span className={`status ${p.status}`}>
                    {p.status === "active" ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="sp-body">
                  <h3>{p.title}</h3>
                  <p className="desc">{p.description}</p>

                  <div className="sp-details">
                    <p><span className="label">Owner Name:</span><span>{p.owner?.name}</span></p>
                    <p><span className="label">Department:</span><span>{p.owner?.department}</span></p>
                    <p><span className="label">Reg No:</span><span>{p.owner?.reg_no}</span></p>
                    <p><span className="label">Required Dept:</span><span>{p.departments?.join(", ") || "All"}</span></p>
                    <p><span className="label">Members:</span><span>{p.members_count}/{p.required_members}</span></p>
                  </div>

                  <div className="sp-actions">

                    {p.is_owner ? (
                      <button className="disabled">Your Project</button>

                    ) : p.status !== "active" ? (
                      <>
                        <button className="disabled">Closed</button>
                        <button className="notify">Notify</button>
                      </>

                    ) : p.join_status === "accepted" ? (
                      <>
                        <button className="accepted">Accepted</button>
                        <button className="leave">Leave Project</button>
                      </>

                    ) : p.join_status === "pending" ? (
                      <button
                        className="cancel"
                        onClick={() => cancel(p.id)}
                        disabled={loadingId === p.id}
                      >
                        {loadingId === p.id ? "Cancelling..." : "Cancel"}
                      </button>

                    ) : p.join_status === "rejected" ? (
                      <>
                        <p className="reason">{p.reason}</p>
                        <button
                          onClick={() => join(p.id)}
                          disabled={loadingId === p.id}
                        >
                          Apply Again
                        </button>
                      </>

                    ) : isFull ? (
                      <button className="full" disabled>
                        Project Full
                      </button>

                    ) : (
                      <button
                        onClick={() => join(p.id)}
                        disabled={loadingId === p.id}
                      >
                        {loadingId === p.id ? "Applying..." : "Apply"}
                      </button>
                    )}

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SearchProjects;
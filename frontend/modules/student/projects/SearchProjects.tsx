import { useEffect, useState } from "react";
import api from "../../../services/api";
import Select from "react-select";
import { departmentGroups, getDeptLabel } from "../../../utils/departments";
import "../../../styles/modules/student/projects/search-projects.css";


const selectStyles = {
  control: (base: any) => ({
    ...base,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "12px",
    color: "#fff",
    minHeight: "48px",
  }),
  menu: (base: any) => ({
    ...base,
    background: "#0f172a",
    zIndex: 9999,
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#fff",
  }),
  option: (base: any, state: any) => ({
    ...base,
    background: state.isFocused ? "#6366f1" : "#0f172a",
    color: "#fff",
  }),
  groupHeading: (base: any) => ({
    ...base,
    color: "#94a3b8",
    fontWeight: 600,
  }),
};

const SearchProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("open");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [userDept, setUserDept] = useState("");

  // ================= FETCH =================
  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/search", {
        params: {
  q: debouncedQuery,
 department: dept,
  status
}
      });
      setProjects(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
}, [debouncedQuery, dept, status]);

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query);
  }, 400);

  return () => clearTimeout(timer);
}, [query]);

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile");
      setUserDept(res.data?.department || "");
    } catch (err) {
      console.error(err);
    }
  };

  fetchProfile();
}, []);

  // ================= ACTIONS =================
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

const leave = async (id: number) => {
  const confirmLeave = window.confirm(
    "Are you sure you want to leave this project?"
  );

  if (!confirmLeave) return;

  try {
    setLoadingId(id);
    await api.post(`/projects/${id}/leave`);
    fetchProjects();
  } catch (err: any) {
    alert(err.response?.data?.detail || "Failed to leave");
  } finally {
    setLoadingId(null);
  }
};

const getFullUrl = (path: string) => {
  if (!path) return "/default-avatar.png";
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `http://localhost:8000/${clean}`;
};


  return (
    <div className="sp-container">
      <h1 className="sp-title">Search Projects</h1>
      

{/* ================= TOP BAR ================= */}
<div className="sp-topbar">
  <input
    className="sp-search"
    placeholder="Search projects..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />

  <Select
    classNamePrefix="react-select"
    styles={selectStyles}
    options={[
  { label: "All", value: "" },
  ...departmentGroups.map((group) => ({
    label: group.label,
    options: group.options,
  })),
]}
   value={
  dept
    ? { label: getDeptLabel(dept), value: dept }
    : { label: "All", value: "" }
}
    onChange={(opt: any) => setDept(opt?.value || "")}
  />

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

      {/* ================= PROJECT LIST ================= */}
      <div className="sp-grid">
        {projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          projects.map((p) => {
            const isFull =
              p.members_count >= p.required_members;

            const isClosed =
              p.status === "closed" || p.status === "completed";

const normalizedUserDept = userDept?.trim().toUpperCase();

// normalize project departments once
const projectDepts = p.departments?.map((d: string) =>
  d.trim().toUpperCase()
) || [];

const isEligible =
  projectDepts.length === 0 || projectDepts.includes(normalizedUserDept);

            return (
              <div key={p.id} className="sp-card">

                {/* HEADER */}
                  <div className="sp-header">
                    <img
                      src={getFullUrl(p.owner?.image)}
                      alt="owner"
                    />

                    <span className={`status ${p.status}`}>
                      {p.status === "active"
                        ? "Open"
                        : p.status === "closed"
                        ? "Closed"
                        : "Completed"}
                    </span>

                    <span className={`eligibility ${isEligible ? "yes" : "no"}`}>
                      {isEligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </div>

                {/* BODY */}
                <div className="sp-body">
                  <h3>{p.title}</h3>
                  <p className="desc">{p.description}</p>

                  <div className="sp-details">
                    <p><span className="label">Owner Name:</span><span>{p.owner?.name}</span></p>
                    <p><span className="label">Department:</span><span>{getDeptLabel(p.owner?.department)}</span></p>
                    <p><span className="label">Reg No:</span><span>{p.owner?.reg_no}</span></p>
                    <p><span className="label">Required Dept:</span><span>
  {p.departments?.length
    ? p.departments.map(getDeptLabel).join(", ")
    : "All"}
</span></p>
                    <p><span className="label">Members:</span><span>{p.members_count}/{p.required_members}</span></p>
                  </div>

                  {/* ================= ACTIONS ================= */}
                  <div className="sp-actions">

                    {p.is_owner ? (
                      <button className="disabled">Your Project</button>

                    /* ✅ FIRST CHECK MEMBER */
                    ) : p.join_status === "accepted" ? (
                      <>
                        <button className="accepted">Accepted</button>
                        <button
                          className="leave"
                          onClick={() => leave(p.id)}
                          disabled={loadingId === p.id}
                        >
                          {loadingId === p.id ? "Leaving..." : "Leave Project"}
                        </button>
                      </>

                    /* ✅ THEN CHECK CLOSED */
                    ) : isClosed ? (
                      <>
                          <button className="disabled">Closed</button>

                          {isEligible && (
                            <button className="notify">Notify</button>
                          )}
                        </>

                    /* PENDING */
                    ) : p.join_status === "pending" ? (
                      <button
                        className="cancel"
                        onClick={() => cancel(p.id)}
                        disabled={loadingId === p.id}
                      >
                        {loadingId === p.id ? "Cancelling..." : "Cancel"}
                      </button>

                    /* REJECTED */
                    ) : p.join_status === "rejected" ? (
                      <>
                        <p className="reason">{p.reason}</p>
                          <button
                            onClick={() => join(p.id)}
                            disabled={!isEligible || loadingId === p.id}
                          >
                            {!isEligible
                              ? "Not Eligible"
                              : loadingId === p.id
                              ? "Applying..."
                              : "Apply Again"}
                          </button>
                      </>

                    /* FULL */
                    ) : isFull ? (
                      <button className="full" disabled>
                        Project Full
                      </button>

                    /* DEFAULT APPLY */
                    ) : (
                        <button
                          onClick={() => join(p.id)}
                          disabled={!isEligible || loadingId === p.id}
                        >
                          {!isEligible
                            ? "Not Eligible"
                            : loadingId === p.id
                            ? "Applying..."
                            : "Apply"}
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
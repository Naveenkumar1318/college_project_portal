import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { getDeptLabel, departmentGroups } from "../../../utils/departments";
import "../../../styles/modules/student/projects/create-project.css";

const CreateProject = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 🔥 edit mode
  const isEdit = !!id;


  const [form, setForm] = useState({
    title: "",
    description: "",
    departments: [] as string[],
    requiredMembers: "",
    expectedDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ================= FETCH FOR EDIT =================
  useEffect(() => {
    if (!isEdit) return;

    const fetchProject = async () => {
      const res = await api.get(`/projects/${id}`);
      const p = res.data;

      setForm({
        title: p.title || "",
        description: p.description || "",
        departments: p.departments?.length ? p.departments : ["ALL"],
        requiredMembers: String(p.required_members || ""),
        expectedDate: p.expected_completion || "",
      });
    };

    fetchProject();
  }, [id]);

  // ================= CLOSE DROPDOWN =================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= CHANGE =================
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= DEPARTMENT =================
  const toggleDepartment = (dept: string) => {
    if (dept === "ALL") {
      setForm((prev) => ({
        ...prev,
        departments: ["ALL"],
      }));
      return;
    }

    setForm((prev) => {
      let updated = prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept];

      updated = updated.filter((d) => d !== "ALL");

      return { ...prev, departments: updated };
    });
  };

  const removeDepartment = (dept: string) => {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d !== dept),
    }));
  };

 const filteredDepartments = departmentGroups.map((group) => ({
  category: group.label,
  items: group.options.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  ),
})).filter((g) => g.items.length > 0);

  // ================= SUBMIT =================
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.title || !form.description) {
      return alert("Title & Description required");
    }

    if (!form.requiredMembers || Number(form.requiredMembers) <= 0) {
      return alert("Members must be greater than 0");
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        departments:
          form.departments.includes("ALL") ? [] : form.departments,
        required_members: Math.max(1, Number(form.requiredMembers)),
        expected_completion: form.expectedDate,
      };

      if (isEdit) {
        // 🔥 UPDATE
        await api.put(`/projects/${id}`, payload);
        alert("Project Updated ✅");
      } else {
        // 🔥 CREATE
        await api.post("/projects", payload);
        alert("Project Created ✅");
      }

      navigate("/student/my-projects");

    } catch (err: any) {
      alert(err?.response?.data?.detail || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="cp-page">
    <div className="cp-card">
      <button onClick={() => navigate(-1)}>← Back</button>

      <div className="cp-header">
        <h1>{isEdit ? "Edit Project" : "Create New Project"}</h1>
        <p>Build something meaningful with your team</p>
      </div>

      <form onSubmit={handleSubmit} className="cp-form">

        {/* TITLE */}
        <div className="cp-field">
          <label>Project Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter title"
          />
        </div>

        {/* DESCRIPTION */}
        <div className="cp-field">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter description"
          />
        </div>

        {/* GRID */}
        <div className="cp-grid">

          <div className="cp-field">
            <label>Members</label>
            <input
              type="number"
              name="requiredMembers"
              value={form.requiredMembers}
              onChange={handleChange}
              placeholder="Enter members"
            />
          </div>

          <div className="cp-field">
            <label>Completion Date</label>
            <input
              type="date"
              name="expectedDate"
              value={form.expectedDate}
              onChange={handleChange}
            />
          </div>

        </div>

        {/* DEPARTMENTS */}
        <div className="cp-field" ref={dropdownRef}>
          <label>Departments</label>

          <div
            className="cp-multi"
            onClick={() => setDropdownOpen(true)}
          >
            {form.departments.map((d) => (
              <span key={d} className="cp-chip">
                {d === "ALL" ? "ALL Departments" : getDeptLabel(d)}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDepartment(d);
                  }}
                >
                  ×
                </span>
              </span>
            ))}

            <input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {dropdownOpen && (
            <div className="cp-dropdown">
              {filteredDepartments.map((group) => (
                <div key={group.category}>
                  <div className="cp-group-title">
                    {group.category}
                  </div>

                  {group.items.map((dept) => (
  <div
    key={dept.value}
    className={`cp-item ${
      form.departments.includes("ALL") ||
      form.departments.includes(dept.value)
        ? "active"
        : ""
    }`}
    onClick={() => toggleDepartment(dept.value)}
  >
    {dept.label}
  </div>
))}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* BUTTON */}
        <button className="cp-btn">
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Project"
            : "🚀 Launch Project"}
        </button>

      </form>

    </div>
  </div>
);
};
export default CreateProject;
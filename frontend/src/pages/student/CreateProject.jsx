import { useState, useRef, useEffect } from "react";
import API from "../../services/api";
import "../../styles/student/CreateProject.css";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Biomedical",
  "Artificial Intelligence",
  "Data Science"
];

function CreateProject() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    departments: [],
    requiredMembers: ""
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef();

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleDepartment = (dept) => {
    if (form.departments.includes(dept)) {
      setForm({
        ...form,
        departments: form.departments.filter((d) => d !== dept)
      });
    } else {
      setForm({
        ...form,
        departments: [...form.departments, dept]
      });
    }
  };

  const removeDepartment = (dept) => {
    setForm({
      ...form,
      departments: form.departments.filter((d) => d !== dept)
    });
  };

  const filteredDepartments = DEPARTMENTS.filter((d) =>
    d.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      form.departments.length === 0 ||
      !form.requiredMembers
    ) {
      alert("All fields are required");
      return;
    }

    if (Number(form.requiredMembers) < 1) {
      alert("Required members must be at least 1");
      return;
    }

    try {
      setLoading(true);

      await API.post("/projects/create", {
        title: form.title.trim(),
        description: form.description.trim(),
        departments: form.departments,
        required_members: Number(form.requiredMembers)
      });

      alert("Project Created Successfully ✅");

      setForm({
        title: "",
        description: "",
        departments: [],
        requiredMembers: ""
      });

      setSearchTerm("");
      setDropdownOpen(false);

    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container">
      <div className="create-card">
        <h2>Create New Project</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Project Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter project title"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe your project..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group" ref={dropdownRef}>
            <label>Departments</label>

            <div
              className="multi-select-container"
              onClick={() => setDropdownOpen(true)}
            >
              <div className="selected-chips">
                {form.departments.map((dept) => (
                  <div key={dept} className="chip">
                    {dept}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDepartment(dept);
                      }}
                    >
                      ✕
                    </span>
                  </div>
                ))}

                <input
                  type="text"
                  placeholder="Search department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setDropdownOpen(true)}
                />
              </div>
            </div>

            {dropdownOpen && (
              <div className="dropdown-list">
                {filteredDepartments.length === 0 ? (
                  <div className="no-result">No departments found</div>
                ) : (
                  filteredDepartments.map((dept) => (
                    <div
                      key={dept}
                      className={`dropdown-item ${
                        form.departments.includes(dept) ? "active" : ""
                      }`}
                      onClick={() => toggleDepartment(dept)}
                    >
                      {dept}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Required Members</label>
            <input
              type="number"
              name="requiredMembers"
              min="1"
              value={form.requiredMembers}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="create-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateProject;
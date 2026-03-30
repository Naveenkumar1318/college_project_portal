import { useState, useRef, useEffect } from "react";
import api from "../../../services/api";
import "../../../styles/create-project.css";

const CreateProject = () => {
  // ✅ Departments
  const DEPARTMENTS = [
    {
      category: "COMMON",
      items: ["ALL Departments"],
    },
    {
      category: "UG Courses",
      items: [
        "B.E. Aeronautical Engineering",
        "B.E. Bio Medical Engineering",
        "B.E. Civil Engineering",
        "B.Arch. Architecture",
        "B.E. Computer Science and Engineering",
        "B.E. CSE (Cyber Security)",
        "B.E. CSE (AI & ML)",
        "B.E. Electronics and Communication Engineering",
        "B.E. Electrical and Electronics Engineering",
        "B.E. Mechanical Engineering",
        "B.Tech. Bio Technology",
        "B.Tech. Chemical Engineering",
        "B.Tech. Information Technology",
        "B.Tech. AI and Data Science",
        "B.Tech. CSBS",
      ],
    },
    {
      category: "PG Courses",
      items: [
        "M.E. Communication Systems",
        "M.E. Computer Science Engineering",
        "M.E. Engineering Design",
        "M.E. Power Systems",
        "M.E. Structural Engineering",
        "MBA",
        "MBA Logistics & SCM",
        "MCA",
      ],
    },
    {
      category: "Research",
      items: [
        "Ph.D CSE",
        "Ph.D ECE",
        "Ph.D Mechanical",
        "Ph.D Chemistry",
      ],
    },
  ];

  const [form, setForm] = useState({
    title: "",
    description: "",
    departments: [] as string[],
    requiredMembers: "",
    expectedDate: "",
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Department select logic
  const toggleDepartment = (dept: string) => {
    if (dept === "ALL Departments") {
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

      // ❌ remove ALL if selecting specific
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

  // ✅ FIXED FILTER
  const filteredDepartments = DEPARTMENTS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (
    !form.title ||
    !form.description
  ) {
    return alert("Title & Description required");
  }

  try {
    setLoading(true);

    await api.post("/projects", {
  title: form.title,
  description: form.description,
  departments: form.departments,
  required_members: Number(form.requiredMembers),
  expected_completion: form.expectedDate,
});

    alert("Project Created ✅");

    setForm({
      title: "",
      description: "",
      departments: [],
      requiredMembers: "",
      expectedDate: "",
    });

  } catch (err: any) {
    alert(err?.response?.data?.detail || "Error creating project");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="cp-page">
      <div className="cp-card">
        <div className="cp-header">
          <h1>Create New Project</h1>
          <p>Build something meaningful with your team</p>
        </div>

        <form onSubmit={handleSubmit} className="cp-form">
          <div className="cp-field">
            <label>Project Title</label>
            <input name="title" value={form.title} onChange={handleChange} />
          </div>

          <div className="cp-field">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="cp-grid">
            <div className="cp-field">
              <label>Members</label>
              <input
                type="number"
                name="requiredMembers"
                value={form.requiredMembers}
                onChange={handleChange}
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

          {/* Departments */}
          <div className="cp-field" ref={dropdownRef}>
            <label>Departments</label>

            <div
              className="cp-multi"
              onClick={() => setDropdownOpen(true)}
            >
              {form.departments.map((d) => (
                <span key={d} className="cp-chip">
                  {d === "ALL" ? "ALL Departments" : d}
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
                {filteredDepartments.length === 0 && (
                  <div className="cp-empty">No departments found</div>
                )}

                {filteredDepartments.map((group) => (
                  <div key={group.category}>
                    <div className="cp-group-title">{group.category}</div>

                    {group.items.map((dept) => (
                      <div
                        key={dept}
                        className={`cp-item ${
                          form.departments.includes("ALL") ||
                          form.departments.includes(dept)
                            ? "active"
                            : ""
                        }`}
                        onClick={() => toggleDepartment(dept)}
                      >
                        {dept}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="cp-btn">
            {loading ? "Launching..." : "🚀 Launch Project"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
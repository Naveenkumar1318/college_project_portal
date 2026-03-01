import { useState } from "react";
import API from "../../services/api";
import "../../styles/student/CreateProject.css";

function CreateProject() {

  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    requiredMembers: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.department || !form.requiredMembers) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await API.post("/projects/create", {
        title: form.title,
        description: form.description,
        department: form.department,
        required_members: Number(form.requiredMembers)
      });

      alert("Project Created Successfully ✅");

      setForm({
        title: "",
        description: "",
        department: "",
        requiredMembers: ""
      });

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
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe your project..."
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              placeholder="Ex: CSE / IT / ECE"
              value={form.department}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Required Members</label>
            <input
              type="number"
              name="requiredMembers"
              placeholder="Number of members needed"
              value={form.requiredMembers}
              onChange={handleChange}
              min="1"
              required
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
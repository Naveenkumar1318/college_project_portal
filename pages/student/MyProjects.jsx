import { useEffect, useState } from "react";
import "../../styles/student/MyProjects.css";

function MyProjects() {

  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const dummyProjects = [
      {
        id: 1,
        title: "AI-Based Resume Analyzer",
        status: "In Progress",
        progress: 65
      }
    ];

    const dummyRequests = Array.from({ length: 18 }, (_, i) => {

      const gender = i % 2 === 0 ? "male" : "female";
      const rollNumber = `ACE2024${(100 + i)}`;

      return {
        id: i + 1,
        name: gender === "male" ? `Rahul ${i + 1}` : `Priya ${i + 1}`,
        department: i % 2 === 0 ? "Computer Science" : "Information Technology",
        year: `${(i % 4) + 1} Year`,
        roll: rollNumber,
        photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${gender}${i}`
      };
    });

    setTimeout(() => {
      setProjects(dummyProjects);
      setRequests(dummyRequests);
      setLoading(false);
    }, 1000);

  }, []);

  const handleAccept = (id) => {
    alert("Request Accepted ✅");
    setRequests(requests.filter(req => req.id !== id));
  };

  const handleReject = (id) => {
    alert("Request Rejected ❌");
    setRequests(requests.filter(req => req.id !== id));
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="myprojects-container">

      <h2 className="page-title">My Current Project</h2>

      {projects.map(project => (
        <div key={project.id} className="project-card">

          <div className="card-header">
            <h3>{project.title}</h3>
            <span className="status-badge in-progress">
              {project.status}
            </span>
          </div>

          <div className="progress-section">
            <div className="progress-label">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>

        </div>
      ))}

      <h2 className="request-title">
        Join Requests ({requests.length})
      </h2>

      <div className="request-grid">

        {requests.map(student => (
          <div key={student.id} className="request-card">

            <img
              src={student.photo}
              alt={student.name}
              className="profile-photo"
            />

            <div className="student-info">
              <h4>{student.name}</h4>
              <p><strong>Roll:</strong> {student.roll}</p>
              <p>{student.department}</p>
              <p>{student.year}</p>
            </div>

            <div className="request-actions">
              <button
                className="accept-btn"
                onClick={() => handleAccept(student.id)}
              >
                Accept
              </button>

              <button
                className="reject-btn"
                onClick={() => handleReject(student.id)}
              >
                Reject
              </button>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default MyProjects;
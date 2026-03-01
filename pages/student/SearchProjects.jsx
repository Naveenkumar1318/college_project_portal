import { useEffect, useState } from "react";
import "../../styles/student/SearchProjects.css"; // reuse same style

function SearchMentor() {

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  const MAX_STUDENTS = 4; // max students per mentor

  // ================= DUMMY DATA =================

  useEffect(() => {

    const dummyMentors = [
      {
        id: 1,
        name: "Dr. Kumar",
        department: "Computer Science",
        specialization: "Artificial Intelligence",
        experience: "10 Years",
        students: ["Arun", "Meena", "Rahul"] // 1 vacancy
      },
      {
        id: 2,
        name: "Dr. Priya",
        department: "Information Technology",
        specialization: "Web Development",
        experience: "8 Years",
        students: ["Karthik", "Divya", "Sanjay", "Rohit"] // FULL
      },
      {
        id: 3,
        name: "Dr. Anil",
        department: "Electronics",
        specialization: "IoT Systems",
        experience: "12 Years",
        students: ["Sneha", "Arjun"] // 2 vacancy
      },
      {
        id: 4,
        name: "Dr. Lavanya",
        department: "Computer Science",
        specialization: "Cyber Security",
        experience: "9 Years",
        students: ["Vikram", "Anitha", "Deepak"] // 1 vacancy
      }
    ];

    setTimeout(() => {
      setMentors(dummyMentors);
      setLoading(false);
    }, 1000);

  }, []);

  // ================= REQUEST MENTOR =================

  const handleRequest = (mentorId) => {

    const mentor = mentors.find(m => m.id === mentorId);

    if (mentor.students.length >= MAX_STUDENTS) {
      alert("Mentor is Full ❌");
      return;
    }

    alert("Mentor Request Sent ✅");
  };

  return (
    <div className="search-container">
      <h2 className="page-title">Search Mentors</h2>

      {loading ? (
        <p>Loading mentors...</p>
      ) : mentors.length === 0 ? (
        <p>No mentors available.</p>
      ) : (
        <div className="search-grid">
          {mentors.map(mentor => {

            const isFull = mentor.students.length >= MAX_STUDENTS;
            const vacancy = MAX_STUDENTS - mentor.students.length;

            return (
              <div key={mentor.id} className="search-card">

                <div className="card-header">
                  <h3>{mentor.name}</h3>
                  <span className="status-badge open">
                    {isFull ? "Full" : "Available"}
                  </span>
                </div>

                <p className="department">
                  Department: {mentor.department}
                </p>

                <p>
                  Specialization: {mentor.specialization}
                </p>

                <p>
                  Experience: {mentor.experience}
                </p>

                {/* Assigned Students */}
                <p className="team-members">
                  Assigned Students ({mentor.students.length}/{MAX_STUDENTS}):{" "}
                  {mentor.students.join(", ")}
                </p>

                {/* Vacancy Info */}
                {isFull ? (
                  <p className="full-notice">🚫 Mentor Full</p>
                ) : (
                  <p className="vacancy-notice">
                    ✅ {vacancy} Slot Available
                  </p>
                )}

                <button
                  className={`join-btn ${isFull ? "disabled-btn" : ""}`}
                  onClick={() => handleRequest(mentor.id)}
                  disabled={isFull}
                >
                  {isFull ? "Full" : "Send Request"}
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchMentor;
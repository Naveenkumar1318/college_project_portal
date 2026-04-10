import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../../../services/api";

import "../../../../../styles/modules/student/projects/My-Project-Details/tabs/MentorTab.css";

interface Mentor {
  user_id: string;
  name: string;
  department: string;
  image: string;
  email: string;
  request_status?: "pending" | "accepted" | "rejected" | null;
}

interface Props {
  projectId: number;
  isOwner: boolean;
}

const MentorTab = ({ projectId, isOwner }: Props) => {

  const navigate = useNavigate();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
  }, [projectId]);

  const fetchMentors = async () => {

    try {

      setLoading(true);

      const res = await API.get("/mentors", {
        params: { project_id: projectId }
      });

      setMentors(res.data?.data || []);

    } catch (err) {

      console.error("Error loading mentors", err);
      setMentors([]);

    } finally {

      setLoading(false);

    }

  };

  const requestMentor = async (mentorId: string) => {

    try {

      await API.post("/mentor/request", {
        project_id: projectId,
        mentor_id: mentorId
      });

      fetchMentors();

    } catch (err: any) {

      alert(err.response?.data?.detail || "Request failed");

    }

  };

  const cancelRequest = async (mentorId: string) => {

    try {

      await API.delete(`/mentor/request/${projectId}/${mentorId}`);

      fetchMentors();

    } catch {

      alert("Cancel request failed");

    }

  };

  const removeMentor = async (mentorId: string) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to remove this mentor from the project?"
    );

    if (!confirmDelete) return;

    try {

      await API.delete(`/project/mentor/${projectId}/${mentorId}`);

      setMentors(prev =>
        prev.map(m =>
          m.user_id === mentorId
            ? { ...m, request_status: null }
            : m
        )
      );

      fetchMentors();

    } catch (err: any) {

      alert(err.response?.data?.detail || "Failed to remove mentor");

    }

  };

  if (loading) {
    return <p className="mentor-loading">Loading mentors...</p>;
  }

  return (

    <div className="mentor-grid">

      {mentors.map((mentor) => (

        <div key={mentor.user_id} className="mentor-card">

          <img
            src={
              mentor.image
                ? `http://localhost:8000${mentor.image}`
                : "/default.png"
            }
            alt={mentor.name}
            className="mentor-avatar"
          />

          <h3 className="mentor-name">{mentor.name}</h3>

          <p className="mentor-id">{mentor.user_id}</p>

          <p className="mentor-dept">{mentor.department}</p>

          <div className="mentor-actions">

            <button
              className="mentor-view-btn"
              onClick={() => navigate(`/student/profile/${mentor.user_id}`)}
            >
              View Profile
            </button>

            {isOwner && !mentor.request_status && (
              <button
                className="mentor-request-btn"
                onClick={() => requestMentor(mentor.user_id)}
              >
                Request Mentor
              </button>
            )}

            {mentor.request_status === "pending" && (
              <button
                className="mentor-cancel-btn"
                onClick={() => cancelRequest(mentor.user_id)}
              >
                Cancel Request
              </button>
            )}

            {mentor.request_status === "rejected" && isOwner && (
              <button
                className="mentor-request-btn"
                onClick={() => requestMentor(mentor.user_id)}
              >
                Request Again
              </button>
            )}

            {mentor.request_status === "accepted" && (
              <button
                className="mentor-remove-btn"
                onClick={() => removeMentor(mentor.user_id)}
              >
                Remove Mentor
              </button>
            )}

          </div>

        </div>

      ))}

    </div>

  );

};

export default MentorTab;
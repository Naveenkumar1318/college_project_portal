import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";

import "../../../styles/modules/mentor/requests/mentor-requests.css";

interface Request {
  id: number;
  project_id: number;
  project_title: string;
  student_id: string;
  student_name: string;
  register_no?: string;
  department?: string;
  student_image?: string;
}

const MentorRequests = () => {

  const navigate = useNavigate();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {

    try {

      const res = await API.get("/mentor/requests");

      setRequests(res.data.data || []);

    } catch (err) {

      console.error("Failed to load requests");

    } finally {

      setLoading(false);

    }

  };

  const handleAccept = async (id: number) => {

    try {

      await API.put(`/mentor/requests/${id}/accept`);

      loadRequests();

    } catch {

      alert("Failed to accept request");

    }

  };

  const handleReject = async (id: number) => {

    try {

      await API.put(`/mentor/requests/${id}/reject`);

      loadRequests();

    } catch {

      alert("Failed to reject request");

    }

  };

  if (loading) {
    return <div className="mentor-requests-loading">Loading requests...</div>;
  }

  return (

    <div className="mentor-requests-page">

      <h2 className="mentor-requests-title">Student Requests</h2>

      <div className="mentor-requests-grid">

        {requests.length === 0 && (
          <p>No requests found</p>
        )}

        {requests.map((req) => (

          <div className="mentor-request-card" key={req.id}>

            <img
              src={
                req.student_image
                  ? `http://localhost:8000${req.student_image}`
                  : "/default.png"
              }
              className="mentor-request-avatar"
            />

            <h3>{req.student_name}</h3>

            {req.register_no && (
              <p className="mentor-request-reg">
                {req.register_no}
              </p>
            )}

            {req.department && (
              <p className="mentor-request-dept">
                {req.department}
              </p>
            )}

            <p className="mentor-request-project">
              Project: {req.project_title}
            </p>

            <button
              className="mentor-view-btn"
              onClick={() => navigate(`/student/profile/${req.student_id}`)}
            >
              View Profile
            </button>

            <div className="mentor-request-actions">

              <button
                className="mentor-accept-btn"
                onClick={() => handleAccept(req.id)}
              >
                Accept
              </button>

              <button
                className="mentor-reject-btn"
                onClick={() => handleReject(req.id)}
              >
                Reject
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

};

export default MentorRequests;
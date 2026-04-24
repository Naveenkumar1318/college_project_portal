import { useEffect, useState } from "react";
import API from "../../../services/api";
import "../../../styles/modules/admin/manage/AdminCompletionRequests.css";

interface Request {
  id: number;
  project_id: number;
  title: string;
  status: string;
}

const AdminCompletionRequests = () => {

  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await API.get("/admin/completion-requests");
      setRequests(res.data.data || []);
    } catch (err) {
      console.error("Error loading completion requests:", err);
    }
  };

  const acceptRequest = async (id: number) => {
    try {
      await API.put(`/admin/completion-requests/${id}/accept`);
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectRequest = async (id: number) => {
    try {
      await API.put(`/admin/completion-requests/${id}/reject`);
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-completion">

      <h2 className="admin-completion__title">
        Completion Requests
      </h2>

      <div className="admin-completion__grid">

        {requests.length === 0 && (
          <p className="admin-completion__empty">
            No completion requests available
          </p>
        )}

        {requests.map((r) => (

          <div className="completion-card" key={r.id}>

            <div className="completion-card__header">

              <span className="completion-card__project">
                Project #{r.project_id}
              </span>

              <span className={`completion-card__status ${r.status}`}>
                {r.status}
              </span>

            </div>

            <div className="completion-card__title">
              {r.title}
            </div>

            {r.status === "pending" && (

              <div className="completion-card__actions">

                <button
                  className="completion-card__accept"
                  onClick={() => acceptRequest(r.id)}
                >
                  Accept
                </button>

                <button
                  className="completion-card__reject"
                  onClick={() => rejectRequest(r.id)}
                >
                  Reject
                </button>

              </div>

            )}

          </div>

        ))}

      </div>

    </div>
  );
};

export default AdminCompletionRequests;
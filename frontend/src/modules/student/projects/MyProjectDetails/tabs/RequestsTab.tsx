interface Props {
  requests: any[];
  isOwner: boolean;
  accept: (id: string) => void;
  reject: (id: string) => void;
  navigate: any;
}

const RequestsTab = ({ requests, isOwner, accept, reject, navigate }: Props) => {
  return (
    <div className="pd-list">
      {requests.map((r) => (
        <div key={r.user_id} className="req-card">

          {/* IMAGE */}
          <img
            src={
              r.image
                ? `http://localhost:8000${r.image}`
                : `https://ui-avatars.com/api/?name=${r.name || "User"}`
            }
            className="pd-avatar"
            alt="profile"
          />

          {/* INFO */}
          <div className="pd-info">
            <p className="pd-name">{r.name || "Unknown User"}</p>
            <p className="pd-reg">{r.reg_no || "No Register No"}</p>
            <p className="pd-dept">{r.department || "No Department"}</p>
          </div>

          {/* ACTIONS */}
          <div className="pd-actions-row">
            <button
              className="btn view"
              onClick={() => navigate(`/student/profile/${r.user_id}`)}
            >
              View Profile
            </button>

            {isOwner && (
              <div className="btn-row">
                <button
                  className="btn accept"
                  onClick={() => accept(r.user_id)}
                >
                  Accept
                </button>

                <button
                  className="btn reject"
                  onClick={() => reject(r.user_id)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>

        </div>
      ))}
    </div>
  );
};

export default RequestsTab;
interface Props {
  requests: any[];
  isOwner: boolean;
  accept: (id: string) => void;
  reject: (id: string) => void;
  navigate: any;
}

const RequestsTab = ({ requests, isOwner, accept, reject, navigate }: Props) => {
  return (
    <div>
      {requests.map((r) => (
        <div key={r.user_id} className="pd-card">

          <img src={r.image || "/default.png"} className="pd-avatar" />

          <div className="pd-info">
            <p className="pd-name">{r.name}</p>
            <p>{r.reg_no}</p>
            <p>{r.department}</p>
          </div>

          <div className="pd-actions-row">
            <button onClick={() => navigate(`/profile/${r.user_id}`)}>
              View Profile
            </button>

            {isOwner && (
              <>
                <button onClick={() => accept(r.user_id)}>Accept</button>
                <button onClick={() => reject(r.user_id)}>Reject</button>
              </>
            )}
          </div>

        </div>
      ))}
    </div>
  );
};

export default RequestsTab;
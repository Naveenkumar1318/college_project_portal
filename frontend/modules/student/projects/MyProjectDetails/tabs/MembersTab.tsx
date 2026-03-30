interface Props {
  members: any[];
  isOwner: boolean;
  removeMember: (id: string) => void;
  navigate: any;
}

const MembersTab = ({ members, isOwner, removeMember, navigate }: Props) => {
  return (
    <div>
      {members.map((m) => (
        <div key={m.user_id} className="pd-card">

          <img src={m.image || "/default.png"} className="pd-avatar" />

          <div className="pd-info">
            <p className="pd-name">{m.name}</p>
            <p>{m.reg_no}</p>
            <p>{m.department}</p>
          </div>

          <div className="pd-actions-row">
            <button onClick={() => navigate(`/profile/${m.user_id}`)}>
              View Profile
            </button>

            {isOwner && m.role !== "owner" && (
              <button onClick={() => removeMember(m.user_id)}>
                Remove
              </button>
            )}
          </div>

        </div>
      ))}
    </div>
  );
};

export default MembersTab;
interface Props {
  members: any[];
  navigate: any;
}

const MembersTab = ({ members, navigate }: Props) => {
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

          <button onClick={() => navigate(`/profile/${m.user_id}`)}>
            View Profile
          </button>

        </div>
      ))}
    </div>
  );
};

export default MembersTab;
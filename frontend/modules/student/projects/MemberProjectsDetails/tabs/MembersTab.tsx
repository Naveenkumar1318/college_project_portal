import "../../../../../styles/modules/student/projects/Member-Projects-Details/tabs/MembersTab.css";

interface Props {
  members: any[];
  navigate: any;
}

const MembersTab = ({ members, navigate }: Props) => {

  // 🔹 FIX IMAGE URL
  const getImageUrl = (path?: string) => {
    if (!path) return "/default-avatar.png";

    if (path.startsWith("http")) return path;

    return `http://localhost:8000${path}`;
  };

  return (
    <div className="pd-list">

      {members.map((m) => (

        <div key={m.user_id} className="pd-card">

          {/* AVATAR */}
          <img
            src={getImageUrl(m.image)}
            className="pd-avatar"
            alt="profile"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/default-avatar.png";
            }}
          />

          {/* INFO */}
          <div className="pd-info">

            <p className="pd-name">
              {m.name || "Unknown User"}
            </p>

            <p className="pd-reg">
              {m.reg_no || "No Register No"}
            </p>

            <p className="pd-dept">
              {m.department || "No Department"}
            </p>

          </div>

          {/* ACTION */}
          <button
            className="pd-btn"
            onClick={() =>
              navigate(`/student/profile/${encodeURIComponent(m.user_id)}`)
            }
          >
            View Profile
          </button>

        </div>

      ))}

    </div>
  );
};

export default MembersTab;
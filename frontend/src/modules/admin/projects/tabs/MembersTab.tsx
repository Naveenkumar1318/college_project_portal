import "../../../../styles/modules/admin/projects/tabs/MembersTab.css";
interface Props {
  members: any[];
  navigate: any;
}

const MembersTab = ({ members, navigate }: Props) => {

  const getImageUrl = (path?: string) => {
    if (!path) return "/default-avatar.png";
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  return (

    <div className="apd-list">

      {members.map((m) => (

        <div key={m.user_id} className="apd-card">

          {/* AVATAR */}
          <img
            src={getImageUrl(m.image)}
            className="apd-avatar"
            alt="profile"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/default-avatar.png";
            }}
          />

          {/* INFO */}
          <div className="apd-info">

            <p className="apd-name">
              {m.name || "Unknown User"}
            </p>

            <p className="apd-reg">
              {m.reg_no || "No Register No"}
            </p>

            <p className="apd-dept">
              {m.department || "No Department"}
            </p>

          </div>

          {/* ACTION */}
          <button
            className="apd-btn"
            onClick={() =>
              navigate(`/admin/student/${encodeURIComponent(m.user_id)}`)
            }
          >
            View Student Profile
          </button>

        </div>

      ))}

    </div>

  );

};

export default MembersTab;
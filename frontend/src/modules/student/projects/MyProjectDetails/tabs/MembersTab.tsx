import { getDeptLabel } from "../../../../../utils/departments";

interface Props {
  members: any[];
  isOwner: boolean;
  removeMember: (id: string) => void;
  navigate: any;
}

const MembersTab = ({ members, isOwner, removeMember, navigate }: Props) => {

  // 🔥 FIX IMAGE URL
 const getImageUrl = (path?: string) => {
  if (!path) return "/default-avatar.png";

  if (path.startsWith("http")) return path;

  return `http://localhost:8000${path}`;
};

  return (
    <div className="pd-list">
      {members.map((m) => (
        <div key={m.user_id} className="mem-card">

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
            <p className="pd-name">{m.name || "Unknown User"}</p>
            <p className="pd-reg">{m.reg_no || "No Register No"}</p>
            <p className="pd-dept">
              {getDeptLabel(m.department || "")}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="pd-actions-row">

            <button
              className="btn view"
              onClick={() =>
                navigate(`/student/profile/${encodeURIComponent(m.user_id)}`)
              }
            >
              View Profile
            </button>

            {isOwner && m.role !== "owner" && (
              <button
                className="btn remove"
                onClick={() => removeMember(m.user_id)}
              >
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
import "../../../../styles/modules/admin/projects/tabs/MentorTab.css";

interface Props {
  mentor: any;
  navigate: any;
}

const MentorTab = ({ mentor, navigate }: Props) => {

  const getImageUrl = (path?: string) => {
    if (!path) return "/default-avatar.png";
    if (path.startsWith("http")) return path;
    return `http://localhost:8000${path}`;
  };

  if (!mentor) {
    return <p className="mentor-empty">No mentor assigned to this project</p>;
  }

  return (

    <div className="mentor-grid">

      <div className="mentor-card">

        <img
          src={getImageUrl(mentor.image)}
          className="mentor-avatar"
          alt="mentor"
        />

        <h3 className="mentor-name">
          {mentor.name}
        </h3>

        <p className="mentor-id">
          {mentor.user_id}
        </p>

        <p className="mentor-dept">
          {mentor.department || "No Department"}
        </p>

        <button
          className="mentor-view-btn"
          onClick={() =>
            navigate(`/admin/student/${mentor.user_id}`)
          }
        >
          View Mentor Profile
        </button>

      </div>

    </div>

  );

};

export default MentorTab;
import { useParams, useNavigate } from "react-router-dom";
import "../../../styles/modules/student/projects/Member-Projects-Completed.css";

const CompletedProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="cp-container">

      <button onClick={() => navigate(-1)}>← Back</button>

      <h2>Project {id} Certificate</h2>

      {/* PDF VIEW */}
      <div className="cp-pdf">
        <iframe
          src="/sample.pdf"
          title="certificate"
        />
      </div>

      {/* ACTIONS */}
      <div className="cp-actions">
        <button>View</button>
        <button>Download</button>
      </div>

    </div>
  );
};

export default CompletedProject;
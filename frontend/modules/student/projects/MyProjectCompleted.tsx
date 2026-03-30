import { useParams, useNavigate } from "react-router-dom";
import "../../../styles/My-project-completed.css";

const CompletedProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="cp-container">

      <button onClick={() => navigate(-1)}>← Back</button>

      <h2>Project {id} Certificate</h2>

      <div className="cp-glass">
        <iframe src="/sample.pdf" title="certificate" />
      </div>

      <div className="cp-actions">
        <button>View</button>
        <button>Download</button>
      </div>

    </div>
  );
};

export default CompletedProject;
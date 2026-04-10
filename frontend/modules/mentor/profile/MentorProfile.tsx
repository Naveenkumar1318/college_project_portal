import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaGithub,
  FaLinkedin,
  FaWhatsapp,
  FaEnvelope,
  FaSpinner,
} from "react-icons/fa";
import API from "../../../services/api";
import "../../../styles/modules/mentor/profile/mentor-profile.css";

interface Profile {
  name?: string;
  email?: string;
  staffId?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience?: string;
  dob?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  whatsapp?: string;
  image?: string;
  resume?: string;
  skills?: string;
}

interface Stats {
  mentoringProjects: number;
  completedProjects: number;
  activeStudents: number;
}

const MentorProfile = () => {
  const navigate = useNavigate();
  const { user_id } = useParams();

  const [profile, setProfile] = useState<Profile>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const url = user_id
          ? `/mentor/profile/${user_id}`
          : `/mentor/profile`;

        const { data } = await API.get<Profile>(url);

        setProfile(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load mentor profile:", err);
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user_id]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = user_id
          ? `/mentor/profile/${user_id}/stats`
          : `/mentor/profile/stats`;

        const { data } = await API.get<Stats>(url);

        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };

    fetchStats();
  }, [user_id]);

  const getFullUrl = (path?: string) => {
    if (!path) return null;

    if (path.startsWith("http")) return path;

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    return `http://localhost:8000/${cleanPath}`;
  };

  const handleDownloadCV = () => {
    if (!profile.resume) {
      alert("No resume uploaded.");
      return;
    }

    const fullUrl = getFullUrl(profile.resume);

    if (fullUrl) {
      window.open(fullUrl + "?t=" + Date.now(), "_blank");
    }
  };

  if (loading) {
    return (
      <div className="profile-container loading-state">
        <FaSpinner className="spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container error-state">
        <p>{error}</p>
        <button
          className="btn-outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">

      <button
        className="profile-back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="profile-container">

        <div className="profile-left">

          <p className="intro">Hello, I am</p>

          <div className="name-row">
            <h1>{profile.name || "Mentor"}</h1>
            <span className="badge">{profile.staffId || "STAFF-000"}</span>
          </div>

          <h2 className="role">{profile.designation || "Faculty Mentor"}</h2>

          <p className="bio">{profile.bio || "No bio added yet."}</p>

          {profile.skills && (
            <div className="skills">
              {profile.skills.split(",").map((s, i) => (
                <span key={i} className="skill">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="info">
            <p>
              <strong>Department:</strong> {profile.department || "—"}
            </p>
            <p>
              <strong>Qualification:</strong> {profile.qualification || "—"}
            </p>
            <p>
              <strong>Experience:</strong> {profile.experience || "—"}
            </p>
            <p>
              <strong>Email:</strong> {profile.email || "—"}
            </p>
          </div>

          <div className="actions">
            <button
              className="btn-primary"
              onClick={handleDownloadCV}
            >
              Download CV
            </button>

            {!user_id && (
              <button
                className="btn-outline"
                onClick={() => navigate("/mentor/profile/edit")}
              >
                Edit Profile →
              </button>
            )}
          </div>

          <div className="icons">

            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub />
              </a>
            )}

            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin />
              </a>
            )}

            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp />
              </a>
            )}

            {profile.email && (
              <a href={`mailto:${profile.email}`}>
                <FaEnvelope />
              </a>
            )}

          </div>

          <div className="stats">

            <div>
              <h3>{stats?.mentoringProjects ?? 0}</h3>
              <p>Mentoring Projects</p>
            </div>

            <div>
              <h3>{stats?.completedProjects ?? 0}</h3>
              <p>Completed</p>
            </div>

            <div>
              <h3>{stats?.activeStudents ?? 0}</h3>
              <p>Active Students</p>
            </div>

          </div>

        </div>

        <div className="profile-right">

          {profile.image ? (
            <img
              src={getFullUrl(profile.image) + "?t=" + Date.now()}
              alt={profile.name || "Mentor"}
            />
          ) : (
            <div className="image-placeholder">
              No Image
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default MentorProfile;
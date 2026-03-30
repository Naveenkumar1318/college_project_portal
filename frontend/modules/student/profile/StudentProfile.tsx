import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaLinkedin,
  FaWhatsapp,
  FaEnvelope,
  FaSpinner,
} from "react-icons/fa";
import API from "../../../services/api";
import "../../../styles/student-profile.css";

interface Profile {
  name?: string;
  email?: string;
  registerNo?: string;
  department?: string;
  degree?: string;
  year?: string;
  dob?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  whatsapp?: string;
  image?: string;
  resume?: string;
}

interface Stats {
  myProjects: number;
  myCompleted: number;
  memberProjects: number;
  memberCompleted: number;
}

const StudentProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await API.get<Profile>("/profile");
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Could not load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch project statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get<Stats>("/profile/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    fetchStats();
  }, []);

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

  const getFullUrl = (path?: string) => {
  if (!path) return null;

  if (path.startsWith("http")) return path;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `http://localhost:8000/${cleanPath}`;
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
        <button className="btn-outline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
  

      {/* LEFT SECTION */}
      <div className="profile-left">
        <p className="intro">Hi, my name is</p>

        <div className="name-row">
          <h1>{profile.name || "Student"}</h1>
          <span className="badge">{profile.registerNo || "REG-0000"}</span>
        </div>

        <h2 className="role">{profile.degree || "Student"}.</h2>

        <p className="bio">{profile.bio || "No bio added yet."}</p>

        <div className="info">
          <p>
            <strong>Department:</strong> {profile.department || "—"}
          </p>
          <p>
            <strong>Year:</strong> {profile.year || "—"}
          </p>
          <p>
            <strong>DOB:</strong> {profile.dob || "—"}
          </p>
          <p>
            <strong>Email:</strong> {profile.email || "—"}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="actions">
          <button className="btn-primary" onClick={handleDownloadCV}>
            Download CV
          </button>
          <button
            className="btn-outline"
            onClick={() => navigate("/student/profile/edit")}
          >
            Edit Profile →
          </button>
        </div>

        {/* SOCIAL ICONS */}
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

        {/* STATS SECTION */}
        <div className="stats">
          <div>
            <h3>{stats?.myProjects ?? 0}</h3>
            <p>My Projects</p>
          </div>
          <div>
            <h3>{stats?.myCompleted ?? 0}</h3>
            <p>Completed</p>
          </div>
          <div>
            <h3>{stats?.memberProjects ?? 0}</h3>
            <p>Member Projects</p>
          </div>
          <div>
            <h3>{stats?.memberCompleted ?? 0}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION - PROFILE IMAGE */}
      <div className="profile-right">
        {profile.image ? (
          <img
  src={getFullUrl(profile.image) + "?t=" + Date.now()}
  alt={profile.name || "Profile"}
/>
        ) : (
          <div className="image-placeholder">No Image</div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
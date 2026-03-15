import { useEffect, useState, useMemo } from "react";
import API from "../../services/api";
import OtpField from "../../components/OtpField";
import OtpModal from "../../components/OtpModal";
import useImageUpload from "../../hooks/useImageUpload";
import useResumeUpload from "../../hooks/useResumeUpload";
import ConfirmModal from "../../components/ConfirmModal";
import ParticlesBackground from "../../components/ParticlesBackground";

import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaWhatsapp,
  FaEnvelope,
  FaPhone,
  FaUniversity,
  FaCalendarAlt,
  FaFileUpload,
  FaDownload,
  FaSpinner
} from "react-icons/fa";

import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/student/Profile.css";

const UG_DEPARTMENTS = [
  "Computer Science and Engineering",
  "Information Technology",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical and Electronics Engineering",
  "Electronics and Communication Engineering",
  "Artificial Intelligence and Data Science"
];

const PG_DEPARTMENTS = [
  "M.E. Computer Science",
  "M.E. Software Engineering",
  "MBA",
  "MCA",
  "M.E. Structural Engineering",
  "M.E. Power Systems"
];

function Profile() {
  const [profile, setProfile] = useState({});
  const [originalProfile, setOriginalProfile] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [otpState, setOtpState] = useState({
    emailVerified: false,
    mobileVerified: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const { uploadImage, loading: imageUploading } = useImageUpload();
  const { uploadResume, loading: resumeUploading } = useResumeUpload();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [otpModal, setOtpModal] = useState({
    open: false,
    type: "",
    label: ""
  });

  /* ================= CHANGE DETECTION ================= */
  const isProfileChanged = useMemo(() => {
    if (!originalProfile || !profile) return false;

    const normalize = (value) => {
      if (!value) return "";
      if (typeof value === "string" && value.includes("T")) {
        return value.split("T")[0];
      }
      return String(value).trim();
    };

    const keysToCheck = [
      "name", "email", "mobile", "program", "department", "year",
      "batch", "dob", "gender", "github", "linkedin", "instagram",
      "whatsapp", "description"
    ];

    return keysToCheck.some((key) => {
      const current = normalize(profile[key]);
      const original = normalize(originalProfile[key]);
      return current !== original;
    });
  }, [profile, originalProfile]);

  const isEmailChanged = (profile.email || "") !== (originalProfile.email || "");
  const isMobileChanged = (profile.mobile || "") !== (originalProfile.mobile || "");

  const isOtpPending = (isEmailChanged && !otpState.emailVerified) ||
    (isMobileChanged && !otpState.mobileVerified);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));

    if (name === "email") {
      setOtpState(prev => ({ ...prev, emailVerified: false }));
    }
    if (name === "mobile") {
      setOtpState(prev => ({ ...prev, mobileVerified: false }));
    }
  };

  const handleBackToProfile = () => {
    if (isProfileChanged) {
      setShowConfirmModal(true);
      return;
    }
    setProfile(originalProfile);
    setEditMode(false);
  };

  const confirmDiscardChanges = () => {
    setShowConfirmModal(false);
    setProfile(originalProfile);
    setEditMode(false);
  };

  const cancelDiscardChanges = () => {
    setShowConfirmModal(false);
  };

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProfileChanged) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isProfileChanged]);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/profile");
      setProfile(res.data);
      setOriginalProfile(res.data);
      setOtpState({
        emailVerified: res.data.email_verified || false,
        mobileVerified: res.data.mobile_verified || false
      });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  /* ================= UPDATE PROFILE ================= */
  const profileCompletion = useMemo(() => {
    const fields = [
      profile.name, profile.email, profile.mobile, profile.program,
      profile.department, profile.year, profile.batch, profile.dob,
      profile.gender, profile.github, profile.linkedin, profile.instagram,
      profile.whatsapp, profile.resume_url, profile.profile_image,
      profile.description
    ];
    const filled = fields.filter(field => field && field !== "").length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

const handleUpdate = async () => {
  const loadingToast = toast.loading("Saving profile...");

  try {
    // Use response from update API directly
    const res = await API.put("/profile/update", profile);

    const updatedProfile = res.data;

    toast.dismiss(loadingToast);
    toast.success("Profile updated successfully");

    // Update state with fresh backend data
    setProfile(updatedProfile);
    setOriginalProfile(updatedProfile);

    setOtpState({
      emailVerified: updatedProfile.email_verified || false,
      mobileVerified: updatedProfile.mobile_verified || false
    });

    setEditMode(false);

  } catch (err) {
    toast.dismiss(loadingToast);
    toast.error(err.response?.data?.detail || "Update failed");
  }
};

  /* ================= PASSWORD ================= */
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const loadingToast = toast.loading("Updating password...");
    try {
      await API.put("/profile/change-password", passwordData);
      toast.dismiss(loadingToast);
      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.detail || "Password update failed");
    }
  };

  /* ================= IMAGE ================= */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
    const result = await uploadImage(file);
    if (result !== false) {
      toast.success("Profile photo uploaded successfully");
      fetchProfile();
    }
  };

  /* ================= RESUME ================= */
  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const result = await uploadResume(file);
    if (result !== false) {
      toast.success("CV uploaded successfully");
      fetchProfile();
    }
  };

const handleResumeDownload = () => {
  if (profile.resume_url) {
    window.open(
      `${import.meta.env.VITE_API_URL}${profile.resume_url}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
};

  const departments = profile.program === "UG" ? UG_DEPARTMENTS : PG_DEPARTMENTS;

  if (loading) {
    return (
      <div className="profile-page loading-container">
        <FaSpinner className="spinner" />
      </div>
    );
  }

 const maskMobile = (mobile) => {
  if (!mobile || mobile.length < 4) return "";
  return "+91 ******" + mobile.slice(-4);
};

  return (
     <>
    <div className={`page-container profile-page ${editMode ? "edit-active" : ""}`}>
      <div className="particles-container">
        <ParticlesBackground />
      </div>
      
      <AnimatePresence mode="wait">
        {!editMode ? (
          /* ================= VIEW MODE ================= */
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="profile-view-wrapper"
          >
            <div
              className="portfolio-hero"
              style={{
                "--hero-image": `url(${
                  previewImage ||
                  (profile.profile_image
                    ? `${import.meta.env.VITE_API_URL}${profile.profile_image}`
                    : "/default-avatar.png")
                })`
              }}
            >
              {/* LEFT CONTENT */}
              <div className="hero-left">
                <h4>Hello, I'm</h4>
                <h1>{profile.name || "Student"}</h1>
                <h2>
  {profile.program ? `${profile.program} Student` : "Student"} ·{" "}
  {profile.department || "Department"}
</h2>

                <p className="hero-description">
                  {profile.description || "No description added yet."}
                </p>

                <div className="hero-contact">
                  <p><FaEnvelope /> {profile.email || "email@example.com"}</p>
                  <p><FaPhone /> {maskMobile(profile.mobile) || "+91 *****1234"}</p>
                  <p><FaUniversity /> {profile.year || "2"} Year · {profile.gender || "Male"}</p>
                  {profile.dob && (
                    <p><FaCalendarAlt /> {new Date(profile.dob).toLocaleDateString()}</p>
                  )}
                </div>

                <div className="hero-social">
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer">
                      <FaGithub />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                      <FaLinkedin />
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer">
                      <FaInstagram />
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener noreferrer">
                      <FaWhatsapp />
                    </a>
                  )}
                </div>

                {profile.resume_url && (
                  <button className="btn-outline" onClick={handleResumeDownload}>
                    <FaDownload /> Download Resume
                  </button>
                )}

                <div className="completion-wrapper">
                  <div className="completion-label">
                    Profile Completion: {profileCompletion}%
                  </div>
                  <div className="completion-bar">
                    <motion.div
                      className="completion-progress"
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompletion}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>

                <button className="btn-purple" onClick={() => setEditMode(true)}>
                  Edit Profile
                </button>
              </div>
            </div>
          </motion.div>

        ) : (
          /* ================= EDIT MODE ================= */
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="profile-edit-wrapper"
          >
            <div className="profile-edit-container">
              <button className="back-btn" onClick={handleBackToProfile}>
                ← Back to Profile
              </button>

              {/* Image Upload Section */}
              <div className="edit-section">
                <div className="section-title">Profile Image</div>
                <div className="image-upload-section">
                  <img
                    src={
                      previewImage ||
                      (profile.profile_image
                        ? `${import.meta.env.VITE_API_URL}${profile.profile_image}`
                        : "/default-avatar.png")
                    }
                    alt="profile"
                  />
                  <label className="upload-label">
                    <FaFileUpload />
                    {imageUploading ? "Uploading..." : "Change Image"}
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="edit-section">
                <div className="section-title">Personal Information</div>
                <div className="edit-grid">
                  <input 
                    name="name" 
                    value={profile.name || ""} 
                    onChange={handleChange} 
                    placeholder="Full Name" 
                  />

                  <OtpField
                    label="Email"
                    name="email"
                    value={profile.email}
                    type="email"
                    verified={otpState.emailVerified}
                    onChange={handleChange}
                    onVerifyClick={() =>
                      setOtpModal({ open: true, type: "email", label: "Email" })
                    }
                  />

                  <OtpField
                    label="Mobile"
                    name="mobile"
                    value={profile.mobile}
                    type="mobile"
                    verified={otpState.mobileVerified}
                    onChange={handleChange}
                    onVerifyClick={() =>
                      setOtpModal({ open: true, type: "mobile", label: "Mobile" })
                    }
                  />

                  <textarea
                    name="description"
                    value={profile.description || ""}
                    onChange={handleChange}
                    placeholder="Add a description about yourself..."
                    rows="3"
                    className="edit-textarea"
                  />
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="edit-section">
                <div className="section-title">Academic Information</div>
                <div className="edit-grid">
                  <select name="program" value={profile.program || ""} onChange={handleChange}>
                    <option value="">Program</option>
                    <option value="UG">UG</option>
                    <option value="PG">PG</option>
                  </select>

                  <select name="department" value={profile.department || ""} onChange={handleChange}>
                    <option value="">Department</option>
                    {departments.map((dept, i) => (
                      <option key={i}>{dept}</option>
                    ))}
                  </select>

                  <select name="year" value={profile.year || ""} onChange={handleChange}>
                    <option value="">Year</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>

                  <select name="batch" value={profile.batch || ""} onChange={handleChange}>
                    <option value="">Select Batch</option>
                    <option value="2021-2025">2021-2025</option>
                    <option value="2022-2026">2022-2026</option>
                    <option value="2023-2027">2023-2027</option>
                    <option value="2024-2028">2024-2028</option>
                  </select>

                  <input 
                    type="date" 
                    name="dob"
                    value={profile.dob ? profile.dob.split("T")[0] : ""}
                    onChange={handleChange}
                  />

                  <select name="gender" value={profile.gender || ""} onChange={handleChange}>
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Social Media Section */}
              <div className="edit-section">
                <div className="section-title">Social Media</div>
                <div className="edit-grid">
                  <input 
                    name="github" 
                    value={profile.github || ""} 
                    onChange={handleChange} 
                    placeholder="GitHub URL" 
                  />
                  <input 
                    name="linkedin" 
                    value={profile.linkedin || ""} 
                    onChange={handleChange} 
                    placeholder="LinkedIn URL" 
                  />
                  <input 
                    name="instagram" 
                    value={profile.instagram || ""} 
                    onChange={handleChange} 
                    placeholder="Instagram URL" 
                  />
                  <input 
                    name="whatsapp" 
                    value={profile.whatsapp || ""} 
                    onChange={handleChange} 
                    placeholder="WhatsApp Number" 
                  />
                </div>
              </div>

              {/* Resume Section */}
              <div className="edit-section">
                <div className="section-title">Resume</div>
                <div className="resume-upload-section">
                  {profile.resume_url && (
                    <button onClick={handleResumeDownload}>
                      <FaDownload /> Download Current Resume
                    </button>
                  )}
                  <label className="upload-label">
                    <FaFileUpload />
                    {resumeUploading ? "Uploading..." : "Upload / Update Resume"}
                    <input type="file" hidden accept=".pdf" onChange={handleResumeChange} />
                  </label>
                </div>
              </div>

              {/* Save Changes Button */}
              {isProfileChanged && (
                <div className="edit-section">
                  <button
                    className="primary-btn"
                    disabled={isOtpPending}
                    onClick={handleUpdate}
                  >
                    {isOtpPending ? "Verify Email/Mobile to Save" : "Save Profile Changes"}
                  </button>
                </div>
              )}

              {/* Password Change Section */}
              <div className="edit-section">
                <div className="section-title">Change Password</div>
                <div className="edit-grid">
                  <input 
                    type="password" 
                    placeholder="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                  />

                  <input 
                    type="password" 
                    placeholder="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                  />

                  <input 
                    type="password" 
                    placeholder="Confirm Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                  />
                </div>

                <button className="secondary-btn" onClick={handlePasswordChange}>
                  Update Password
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ConfirmModal
        open={showConfirmModal}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        onConfirm={confirmDiscardChanges}
        onCancel={cancelDiscardChanges}
      />

      <OtpModal
        open={otpModal.open}
        type={otpModal.type}
        label={otpModal.label}
        onClose={() => setOtpModal({ open: false, type: "", label: "" })}
        onSuccess={() => {
          if (otpModal.type === "email") {
            setOtpState(prev => ({ ...prev, emailVerified: true }));
          } else {
            setOtpState(prev => ({ ...prev, mobileVerified: true }));
          }
        }}
      />
    </div>
      </>
  );
}

export default Profile;
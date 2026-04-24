import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API, { publicAPI } from "../../../services/api";
import { FaTrash, FaDownload, FaCheckCircle, FaGithub, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import Cropper from "react-easy-crop";
import Select from "react-select";
import "../../../styles/modules/mentor/profile/mentor-profile-edit.css";
import { getCroppedImg } from "../../../utils/cropImage";

interface Profile {
  name?: string;
  staffId?: string;
  email?: string;
  mobile?: string;
  dob?: string;
  gender?: string;
  bio?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience?: string;
  github?: string;
  linkedin?: string;
  whatsapp?: string;
  image?: string;
  resume?: string;
  skills: string;
}

interface FormData {
  name: string;
  staffId: string;
  email: string;
  mobile: string;
  dob: string;
  gender: string;
  bio: string;
  department: string;
  designation: string;
  qualification: string;
  experience: string;
  github: string;
  linkedin: string;
  whatsapp: string;
  imageFile: File | null;
  resumeFile: File | null;
  skills: string;
}

// OTP Modal Component
const OtpModal = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  onResend, 
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onVerify: (otp: string) => void; 
  onResend: () => void;
  type: string;
}) => {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimer(60);
      setCanResend(false);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleResend = () => {
    if (canResend) {
      onResend();
      setTimer(60);
      setCanResend(false);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-content">
        <h3>Verify {type}</h3>
        <p>Enter the 6-digit OTP sent to your {type.toLowerCase()}</p>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="otp-input"
        />
        <div className="otp-timer">
          {timer > 0 ? (
            <span>Resend available in {timer}s</span>
          ) : (
            <button onClick={handleResend} className="resend-btn">
              Resend OTP
            </button>
          )}
        </div>
        <div className="otp-actions">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={() => onVerify(otp)} className="verify-btn" disabled={otp.length !== 6}>
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};

const selectStyles = {
  control: (base: any) => ({
    ...base,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    minHeight: "42px",
  }),
  menu: (base: any) => ({
    ...base,
    background: "#0f172a",
    zIndex: 9999,
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#fff",
  }),
  option: (base: any, state: any) => ({
    ...base,
    background: state.isFocused ? "#6366f1" : "#0f172a",
    color: "#fff",
  }),
};

const MentorProfileEdit = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    name: "",
    staffId: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    bio: "",
    department: "",
    designation: "",
    qualification: "",
    experience: "",
    github: "",
    linkedin: "",
    whatsapp: "",
    skills: "",
    imageFile: null,
    resumeFile: null,
  });

  const [initialForm, setInitialForm] = useState<Omit<FormData, "imageFile" | "resumeFile">>({
    name: "",
    staffId: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    bio: "",
    skills: "",
    department: "",
    designation: "",
    qualification: "",
    experience: "",
    github: "",
    linkedin: "",
    whatsapp: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [unsavedAction, setUnsavedAction] = useState<(() => void) | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [showMobileOtpModal, setShowMobileOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingMobile, setPendingMobile] = useState("");

  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropLoading, setCropLoading] = useState(false);

  const getFullUrl = (path: string) => {
    if (!path) return null;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `http://localhost:8000/${cleanPath}`;
  };

  const isChanged = () => {
    const current = {
      name: form.name || "",
      staffId: form.staffId || "",
      email: form.email || "",
      mobile: form.mobile || "",
      dob: form.dob || "",
      gender: form.gender || "",
      bio: form.bio || "",
      department: form.department || "",
      designation: form.designation || "",
      qualification: form.qualification || "",
      experience: form.experience || "",
      github: form.github || "",
      linkedin: form.linkedin || "",
      whatsapp: form.whatsapp || "",
      skills: form.skills || "",
    };

    const initial = {
      name: initialForm.name || "",
      staffId: initialForm.staffId || "",
      email: initialForm.email || "",
      mobile: initialForm.mobile || "",
      dob: initialForm.dob || "",
      gender: initialForm.gender || "",
      bio: initialForm.bio || "",
      department: initialForm.department || "",
      designation: initialForm.designation || "",
      qualification: initialForm.qualification || "",
      experience: initialForm.experience || "",
      github: initialForm.github || "",
      linkedin: initialForm.linkedin || "",
      whatsapp: initialForm.whatsapp || "",
      skills: initialForm.skills || "",
    };

    return (
      JSON.stringify(current) !== JSON.stringify(initial) ||
      form.imageFile !== null ||
      form.resumeFile !== null
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await API.get<Profile>("/mentor/profile");
        
        setForm({
          name: data.name || "",
          staffId: data.staffId || "",
          email: data.email || "",
          mobile: data.mobile || "",
          dob: data.dob || "",
          gender: data.gender || "",
          skills: data.skills || "",
          bio: data.bio || "",
          department: data.department || "",
          designation: data.designation || "",
          qualification: data.qualification || "",
          experience: data.experience || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          whatsapp: data.whatsapp || "",
          imageFile: null,
          resumeFile: null,
        });
        
        setInitialForm({
          name: data.name || "",
          staffId: data.staffId || "",
          email: data.email || "",
          mobile: data.mobile || "",
          dob: data.dob || "",
          gender: data.gender || "",
          bio: data.bio || "",
          skills: data.skills || "",
          department: data.department || "",
          designation: data.designation || "",
          qualification: data.qualification || "",
          experience: data.experience || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          whatsapp: data.whatsapp || "",
        });
        
        if (data.image) {
          const url = getFullUrl(data.image);
          setImagePreview(url + "?t=" + Date.now());
        }
        if (data.resume) setResumeFileName(data.resume.split("/").pop() || "Resume");

        if (data.email) setEmailVerified(true);
        if (data.mobile) setMobileVerified(true);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setCropLoading(true);
    try {
      const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedImageBlob], "profile.jpg", { type: "image/jpeg" });
      setForm((prev) => ({ ...prev, imageFile: croppedFile }));
      const previewUrl = URL.createObjectURL(croppedFile);
      setImagePreview(previewUrl);
      setShowCropModal(false);
      setCropImageSrc(null);
    } catch (err) {
      console.error("Crop failed", err);
      alert("Failed to crop image. Please try again.");
    } finally {
      setCropLoading(false);
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, resumeFile: file }));
      setResumeFileName(file.name);
    }
  };

  const handleDeleteResume = () => {
    setForm((prev) => ({ ...prev, resumeFile: null }));
    setResumeFileName(null);
  };

  const handleViewResume = () => {
    if (form.resumeFile) {
      const url = URL.createObjectURL(form.resumeFile);
      window.open(url, "_blank");
    } else if (resumeFileName) {
      window.open(getFullUrl(`uploads/resumes/${resumeFileName}`), "_blank");
    } else {
      alert("No resume uploaded.");
    }
  };

  const handleSendEmailOtp = async () => {
    if (!form.email) {
      alert("Please enter email first.");
      return;
    }
    try {
      await publicAPI.post("/auth/send-otp", { email: form.email.trim() });
      setPendingEmail(form.email);
      setShowEmailOtpModal(true);
    } catch (err) {
      alert("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyEmailOtp = async (otp: string) => {
    try {
      await publicAPI.post("/auth/verify-email-otp", {
        email: pendingEmail,
        otp,
      });
      setEmailVerified(true);
      setShowEmailOtpModal(false);
      alert("Email verified successfully!");
    } catch (err) {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleResendEmailOtp = async () => {
    try {
      await publicAPI.post("/auth/send-otp", { email: pendingEmail });
      alert("OTP resent successfully!");
    } catch (err) {
      alert("Failed to resend OTP. Please try again.");
    }
  };

  const handleSendMobileOtp = async () => {
    if (!form.mobile) {
      alert("Please enter mobile number first.");
      return;
    }
    try {
      await publicAPI.post("/auth/send-mobile-otp", {
        mobile: form.mobile.trim(),
      });
      setPendingMobile(form.mobile);
      setShowMobileOtpModal(true);
    } catch (err) {
      alert("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyMobileOtp = async (otp: string) => {
    try {
      await publicAPI.post("/auth/verify-mobile-otp", {
        mobile: pendingMobile,
        otp,
      });
      setMobileVerified(true);
      setShowMobileOtpModal(false);
      alert("Mobile verified successfully!");
    } catch (err) {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleResendMobileOtp = async () => {
    try {
      await publicAPI.post("/auth/send-mobile-otp", { mobile: pendingMobile });
      alert("OTP resent successfully!");
    } catch (err) {
      alert("Failed to resend OTP. Please try again.");
    }
  };

  const handleSave = async () => {
    if (form.email !== initialForm.email && !emailVerified) {
      alert("Please verify your new email address before saving.");
      return;
    }
    if (form.mobile !== initialForm.mobile && !mobileVerified) {
      alert("Please verify your new mobile number before saving.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("mobile", form.mobile);
      formData.append("department", form.department);
      formData.append("designation", form.designation);
      formData.append("qualification", form.qualification);
      formData.append("experience", form.experience);
      formData.append("bio", form.bio);
      formData.append("skills", form.skills);
      formData.append("dob", form.dob);
      formData.append("gender", form.gender);
      formData.append("github", form.github);
      formData.append("linkedin", form.linkedin);
      formData.append("whatsapp", form.whatsapp);
      if (form.staffId) formData.append("staffId", form.staffId);
      if (form.imageFile) formData.append("image", form.imageFile);
      if (form.resumeFile) formData.append("resume", form.resumeFile);

      await API.put("/mentor/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data } = await API.get<Profile>("/mentor/profile");
      
      const newInitialForm = {
        name: data.name || "",
        staffId: data.staffId || "",
        email: data.email || "",
        mobile: data.mobile || "",
        dob: data.dob || "",
        gender: data.gender || "",
        bio: data.bio || "",
        skills: data.skills || "",
        department: data.department || "",
        designation: data.designation || "",
        qualification: data.qualification || "",
        experience: data.experience || "",
        github: data.github || "",
        linkedin: data.linkedin || "",
        whatsapp: data.whatsapp || "",
      };
      
      setInitialForm(newInitialForm);
      setForm((prev) => ({
        ...prev,
        ...newInitialForm,
        imageFile: null,
        resumeFile: null,
      }));
      
      if (data.image) {
        const url = getFullUrl(data.image);
        setImagePreview(url + "?t=" + Date.now());
      }
      if (data.resume) setResumeFileName(data.resume.split("/").pop() || "Resume");
      
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isChanged()) {
      setShowUnsavedModal(true);
      setUnsavedAction(() => () => navigate(-1));
    } else {
      navigate(-1);
    }
  };

  const handleSaveAndExit = async () => {
    setShowUnsavedModal(false);
    await handleSave();
    if (unsavedAction) unsavedAction();
  };

  const handleDiscardAndExit = () => {
    setShowUnsavedModal(false);
    if (unsavedAction) unsavedAction();
  };

  const genderOptions = ["Male", "Female", "Other"];

  if (loading) {
    return (
      <div className="edit-container loading-state">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="edit-container">
      {/* OTP Modals */}
      <OtpModal
        isOpen={showEmailOtpModal}
        onClose={() => setShowEmailOtpModal(false)}
        onVerify={handleVerifyEmailOtp}
        onResend={handleResendEmailOtp}
        type="Email"
      />
      <OtpModal
        isOpen={showMobileOtpModal}
        onClose={() => setShowMobileOtpModal(false)}
        onVerify={handleVerifyMobileOtp}
        onResend={handleResendMobileOtp}
        type="Mobile"
      />

      {/* Unsaved changes modal */}
      {showUnsavedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>You have unsaved changes. What would you like to do?</p>
            <div className="modal-buttons">
              <button onClick={handleSaveAndExit} className="btn-save-exit">
                Save and Exit
              </button>
              <button onClick={handleDiscardAndExit} className="btn-discard-exit">
                Discard and Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button and profile picture row */}
      <div className="profile-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <div className="profile-center">
          <div className="profile-picture-section">
            <label htmlFor="image-upload" className="image-upload-label">
              <div className="image-preview-circle">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="profile-image" />
                ) : (
                  <span className="placeholder-text">📷</span>
                )}
              </div>
              <span className="upload-text">Change Picture</span>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
          </div>
          <h2>Edit Profile</h2>
        </div>
        <div className="header-spacer" />
      </div>

      {/* Cropping Modal */}
      {showCropModal && cropImageSrc && (
        <div className="crop-modal" onClick={(e) => {
          if (e.target === e.currentTarget) handleCancelCrop();
        }}>
          <div className="crop-modal-content">
            <div className="crop-container">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="crop-controls">
              <button onClick={handleCancelCrop} disabled={cropLoading}>
                Cancel
              </button>
              <button onClick={handleCropSave} disabled={cropLoading}>
                {cropLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="form-scroll-area">
        {/* Row 1: Name | Staff ID | Email | Mobile */}
        <div className="grid-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
          />
          <input
            type="text"
            name="staffId"
            placeholder="Staff ID"
            value={form.staffId}
            onChange={handleChange}
          />
          <div className="email-field">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              disabled={emailVerified}
            />
            {!emailVerified ? (
              <button onClick={handleSendEmailOtp} disabled={!form.email} className="small-btn">
                Verify Email
              </button>
            ) : (
              <span className="verified-badge-inline">
                <FaCheckCircle /> Verified
              </span>
            )}
          </div>
          <div className="mobile-field">
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={handleChange}
              disabled={mobileVerified}
            />
            {!mobileVerified ? (
              <button onClick={handleSendMobileOtp} disabled={!form.mobile} className="small-btn">
                Verify Mobile
              </button>
            ) : (
              <span className="verified-badge-inline">
                <FaCheckCircle /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Row 2: DOB | Gender */}
        <div className="grid-2">
          <input type="date" name="dob" placeholder="Date of Birth" value={form.dob} onChange={handleChange} />
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            {genderOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Description */}
        <textarea name="bio" placeholder="Bio / Description" rows={3} value={form.bio} onChange={handleChange} />

        {/* Skills */}
        <input
          type="text"
          name="skills"
          placeholder="Skills (comma separated e.g. React,Python,FastAPI)"
          value={form.skills || ""}
          onChange={handleChange}
        />

        {/* Mentor Fields - Department, Designation, Qualification */}
        <div className="grid-3">
          <input
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
          />
          <input
            name="designation"
            placeholder="Designation"
            value={form.designation}
            onChange={handleChange}
          />
          <input
            name="qualification"
            placeholder="Qualification"
            value={form.qualification}
            onChange={handleChange}
          />
        </div>

        {/* Experience and Resume Upload */}
        <div className="grid-2">
          <input
            name="experience"
            placeholder="Experience (Years)"
            value={form.experience}
            onChange={handleChange}
          />
          <div className="resume-upload-wrapper">
            <label htmlFor="resume-upload" className="resume-upload-button">
              {resumeFileName ? resumeFileName : "Upload Resume"}
            </label>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              style={{ display: "none" }}
            />
            {resumeFileName && (
              <div className="resume-actions">
                <button onClick={handleViewResume} className="icon-btn" title="View">
                  <FaDownload />
                </button>
                <button onClick={handleDeleteResume} className="icon-btn danger" title="Delete">
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="social-links-section">
          <h3>Social Links</h3>
          <div className="grid-3">
            <div className="social-field">
              <FaGithub className="social-icon" />
              <input
                type="url"
                name="github"
                placeholder="GitHub Profile URL"
                value={form.github}
                onChange={handleChange}
              />
            </div>
            <div className="social-field">
              <FaLinkedin className="social-icon" />
              <input
                type="url"
                name="linkedin"
                placeholder="LinkedIn Profile URL"
                value={form.linkedin}
                onChange={handleChange}
              />
            </div>
            <div className="social-field">
              <FaWhatsapp className="social-icon" />
              <input
                type="tel"
                name="whatsapp"
                placeholder="WhatsApp Number"
                value={form.whatsapp}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isChanged() && (
          <button onClick={handleSave} disabled={saving} className="save-btn">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        )}

        {/* Change Password */}
        <div className="password-section">
          <h3>Change Password</h3>
          <div className="grid-3">
            <div className="password-field">
              <input
                type={showOldPassword ? "text" : "password"}
                placeholder="Old Password"
                id="oldPassword"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="text-btn"
              >
                {showOldPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="password-field">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                id="newPassword"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-btn"
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                const old = (document.getElementById("oldPassword") as HTMLInputElement).value;
                const newPwd = (document.getElementById("newPassword") as HTMLInputElement).value;
                if (!old || !newPwd) {
                  alert("Please fill both fields.");
                  return;
                }
                try {
                  await API.put("/mentor/profile/change-password", {
                    currentPassword: old,
                    newPassword: newPwd,
                  });
                  alert("Password changed successfully!");
                  (document.getElementById("oldPassword") as HTMLInputElement).value = "";
                  (document.getElementById("newPassword") as HTMLInputElement).value = "";
                } catch (err) {
                  alert("Failed to change password. Check your current password.");
                }
              }}
              className="change-btn"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfileEdit;
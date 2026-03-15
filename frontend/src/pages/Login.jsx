import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../styles/form.css";

function Login({ role = "Student" }) {

  const [form, setForm] = useState({
    registerNumber: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  // Reset form state
  const [resetForm, setResetForm] = useState({
    registerNumber: "",
    emailOrMobile: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [step, setStep] = useState(1); // Step 1 = Verify, Step 2 = Change Password

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetForm({ ...resetForm, [e.target.name]: e.target.value });
  };

  // ---------------- LOGIN ----------------

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8000/login", {
        registerNumber: form.registerNumber,
        password: form.password
      });

      localStorage.setItem("token", res.data.access_token);
      alert("Login Successful");
       console.log("Login success. Navigating...");

      // Navigate based on role
      if (role === "Student") {
        navigate("/student/dashboard");
      } else if (role === "Staff") {
        navigate("/staff/dashboard"); // if exists
      } else if (role === "Admin") {
        navigate("/admin/dashboard"); // if exists
      }

    } catch (err) {
      alert(err.response?.data?.detail || "Login failed");
    }
  };

  // ---------------- VERIFY USER ----------------

  const handleVerifyUser = async () => {
    if (!resetForm.registerNumber || !resetForm.emailOrMobile) {
      alert("All fields are required");
      return;
    }

    try {
      await axios.post("http://localhost:8000/verify-user", {
        registerNumber: resetForm.registerNumber,
        emailOrMobile: resetForm.emailOrMobile
      });

      setStep(2);

    } catch (err) {
      alert(err.response?.data?.detail || "Verification failed");
    }
  };

  // ---------------- RESET PASSWORD ----------------

  const handleResetPassword = async () => {

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await axios.post("http://localhost:8000/reset-password", {
        registerNumber: resetForm.registerNumber,
        newPassword: resetForm.newPassword
      });

      alert("Password Updated Successfully");

      setShowReset(false);
      setStep(1);

    } catch (err) {
      alert(err.response?.data?.detail || "Reset failed");
    }
  };

  return (
    <div className="premium-wrapper">
      <div className="premium-card">
        <h2>{role} Login</h2>

        {/* REGISTER NUMBER */}
        <div className={`input-box ${focused === "registerNumber" || form.registerNumber ? "active" : ""}`}>
          <input
            type="text"
            name="registerNumber"
            value={form.registerNumber}
            onFocus={() => setFocused("registerNumber")}
            onBlur={() => setFocused("")}
            onChange={handleChange}
          />
          <label>Register Number / ID</label>
        </div>

        {/* PASSWORD */}
        <div className={`input-box ${focused === "password" || form.password ? "active" : ""}`}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused("")}
            onChange={handleChange}
          />
          <label>Password</label>

          <span
            className="eye-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "HIDE" : "SHOW"}
          </span>
        </div>

        <div className="forgot-row">
          <button className="link-btn" onClick={() => setShowReset(true)}>
            Forgot Password?
          </button>
        </div>

        <button className="primary-btn" onClick={handleLogin}>
          Secure Login
        </button>
      </div>

      {/* ================= RESET MODAL ================= */}

      {showReset && (
        <div className="reset-modal">
          <div className="reset-card">
            <span
              className="close-btn"
              onClick={() => {
                setShowReset(false);
                setStep(1);
              }}
            >
              ✕
            </span>

            <h3>Reset Password</h3>

            {step === 1 && (
              <>
                <input
                  type="text"
                  name="registerNumber"
                  placeholder="Register Number / Staff ID"
                  onChange={handleResetChange}
                />

                <input
                  type="text"
                  name="emailOrMobile"
                  placeholder="Registered Email or Mobile"
                  onChange={handleResetChange}
                />

                <button onClick={handleVerifyUser}>
                  Verify
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password"
                  onChange={handleResetChange}
                />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  onChange={handleResetChange}
                />

                <button onClick={handleResetPassword}>
                  Update Password
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
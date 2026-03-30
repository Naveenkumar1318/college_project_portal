import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loginUser } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { role } = useParams();

  // ✅ SAFE ROLE HANDLING
  const validRoles = ["student", "mentor", "admin"];
  const userRole = validRoles.includes(role || "") ? role! : "student";

  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { login } = useAuth();

  const [form, setForm] = useState({
    id: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [resetForm, setResetForm] = useState({
    id: "",
    contact: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [step, setStep] = useState(1);

  const getLabel = () => {
    if (userRole === "student") return "Register Number";
    if (userRole === "mentor") return "Employee ID";
    return "Username";
  };

const handleLogin = async () => {
  setError("");

  if (!form.id.trim() && !form.password.trim()) {
    setError("Please enter username and password");
    return;
  }

  if (!form.id.trim()) {
    setError("Please enter username");
    return;
  }

  if (!form.password.trim()) {
    setError("Please enter password");
    return;
  }

  try {
    const res = await loginUser(form);

    // ✅ NEW: use context
    login(res.access_token);

    switch (res.role) {
      case "student":
        navigate("/student/dashboard");
        break;
      case "mentor":
        navigate("/mentor/dashboard");
        break;
      case "admin":
        navigate("/admin/dashboard");
        break;
      default:
        navigate("/");
    }

  } catch (err: any) {
    const message =
      err?.response?.data?.detail ||
      err?.detail ||
      "Invalid username or password";

    if (message.toLowerCase().includes("not found")) {
      setError("User not found. Please check your username.");
    } else if (message.toLowerCase().includes("password")) {
      setError("Invalid password. Please try again.");
    } else {
      setError("Invalid username or password");
    }
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>{userRole.toUpperCase()} Login</h2>

        {error && <p className="error-text">{error}</p>}

        <div className="input-box">
          <input
            placeholder={getLabel()}
            onChange={(e) =>
              setForm({ ...form, id: e.target.value })
            }
          />
        </div>

        <div className="input-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
          <span
            className="show-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "HIDE" : "SHOW"}
          </span>
        </div>

        <div className="forgot" onClick={() => setShowReset(true)}>
          Forgot Password?
        </div>

        <button className="login-btn" onClick={handleLogin}>
          SECURE LOGIN
        </button>

      </div>

      {/* RESET MODAL */}
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
                  placeholder={getLabel()}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, id: e.target.value })
                  }
                />

                <input
                  placeholder="Registered Email or Mobile"
                  onChange={(e) =>
                    setResetForm({ ...resetForm, contact: e.target.value })
                  }
                />

                <button onClick={() => setStep(2)}>Verify</button>
              </>
            )}

            {step === 2 && (
              <>
                <input
                  type="password"
                  placeholder="New Password"
                  onChange={(e) =>
                    setResetForm({ ...resetForm, newPassword: e.target.value })
                  }
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  onChange={(e) =>
                    setResetForm({ ...resetForm, confirmPassword: e.target.value })
                  }
                />

                <button
                  onClick={() => {
                    if (
                      resetForm.newPassword !== resetForm.confirmPassword
                    ) {
                      alert("Passwords do not match");
                      return;
                    }

                    alert("Password Updated Successfully");
                    setShowReset(false);
                    setStep(1);
                  }}
                >
                  Update Password
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
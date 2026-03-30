import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/Register.css";
import { registerUser } from "../../services/auth.service";

type Role = "student" | "mentor";

type RegisterForm = {
  id: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function Register() {
  const [role, setRole] = useState<Role>("student");

  const [form, setForm] = useState<RegisterForm>({
    id: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [focused, setFocused] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.id || !form.email || !form.password || !form.confirmPassword) {
      setError("All fields are required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Invalid email format");
      return false;
    }

    if (!passwordRegex.test(form.password)) {
      setError(
        "Password must include:\n• 1 uppercase\n• 1 lowercase\n• 1 number\n• 1 special character"
      );
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    setError("");

    if (!validate()) return;

    setLoading(true);

    try {
      await registerUser({
        id: form.id.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      });

      alert("Registration successful");
      navigate(`/login/${role}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-wrapper">
      <div className="premium-card">

        <h2>Create {role === "student" ? "Student" : "Mentor"} Account</h2>

        {/* ROLE SWITCH */}
        <div className="role-toggle">
          <button
            className={role === "student" ? "active-role" : ""}
            onClick={() => setRole("student")}
            type="button"
          >
            Student
          </button>

          <button
            className={role === "mentor" ? "active-role" : ""}
            onClick={() => setRole("mentor")}
            type="button"
          >
            Staff
          </button>
        </div>

        {/* ERROR */}
        {error && <p className="error-text">{error}</p>}

        {/* ID */}
        <div className={`input-box ${focused === "id" || form.id ? "active" : ""}`}>
          <input
            name="id"
            value={form.id}
            onFocus={() => setFocused("id")}
            onBlur={() => setFocused("")}
            onChange={handleChange}
          />
          <label>{role === "student" ? "Register Number" : "Employee ID"}</label>
        </div>

        {/* EMAIL */}
        <div className={`input-box ${focused === "email" || form.email ? "active" : ""}`}>
          <input
            name="email"
            value={form.email}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused("")}
            onChange={handleChange}
          />
          <label>Email</label>
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
          <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "HIDE" : "SHOW"}
          </span>
        </div>

        {/* CONFIRM PASSWORD */}
        <div className={`input-box ${focused === "confirmPassword" || form.confirmPassword ? "active" : ""}`}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onFocus={() => setFocused("confirmPassword")}
            onBlur={() => setFocused("")}
            onChange={handleChange}
          />
          <label>Confirm Password</label>
          <span className="eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? "HIDE" : "SHOW"}
          </span>
        </div>

        {/* BUTTON */}
        <button className="primary-btn" onClick={handleRegister} disabled={loading}>
          {loading ? "Creating..." : `Create ${role === "student" ? "Student" : "Staff"} Account`}
        </button>

      </div>
    </div>
  );
}

export default Register;
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../styles/form.css";

function Register() {
  const [role, setRole] = useState("Student");

  const [form, setForm] = useState({
    registerNumber: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [focused, setFocused] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/register", {
        registerNumber: form.registerNumber,
        email: form.email,
        password: form.password,
        role: role
      });

      alert(res.data.message);

      if (role === "Student") {
        navigate("/student-login");
      } else if (role === "Staff") {
        navigate("/staff-login");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="premium-wrapper">
      <div className="premium-card">
        <h2>Create Account</h2>

        {/* Role Toggle */}
        <div className="role-toggle">
          <button
            className={role === "Student" ? "active-role" : ""}
            onClick={() => setRole("Student")}
            type="button"
          >
            Student
          </button>

          <button
            className={role === "Staff" ? "active-role" : ""}
            onClick={() => setRole("Staff")}
            type="button"
          >
            Staff
          </button>
        </div>

        {/* Inputs */}
        <div className={`input-box ${focused === "registerNumber" || form.registerNumber ? "active" : ""}`}>
          <input
            type="text"
            name="registerNumber"
            value={form.registerNumber}
            onFocus={() => setFocused("registerNumber")}
            onBlur={() => setFocused("")}
            onChange={handleChange}
          />
          <label>{role} Register Number</label>
        </div>

        <div className={`input-box ${focused === "email" || form.email ? "active" : ""}`}>
          <input
            type="email"
            name="email"
            value={form.email}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused("")}
            onChange={handleChange}
          />
          <label>Email</label>
        </div>

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

        <button className="primary-btn" onClick={handleRegister}>
          Create {role} Account
        </button>
      </div>
    </div>
  );
}

export default Register;
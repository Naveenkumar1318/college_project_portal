import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 80);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`nav-wrapper 
        ${scrolled ? "scrolled shrink" : "transparent"} 
        ${visible ? "show" : "hide"}`}
    >
      <div className="navbar">
        <div className="logo">Adhiyamaan Project Collab</div>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/student-login">Student</NavLink>
          <NavLink to="/staff-login">Staff</NavLink>
          <NavLink to="/admin-login">Admin</NavLink>
          <NavLink to="/register" className="nav-btn">
            Get Started
          </NavLink>
        </div>

        <div
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>
    </div>
  );
}

export default Navbar;
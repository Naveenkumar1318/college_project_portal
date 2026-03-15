import { useEffect, useState } from "react";
import "../styles/home.css";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Link } from "react-router-dom";

function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Word animation
  const headline = "The Future of College Project Collaboration";
  const words = headline.split(" ");

  return (
    <div className="premium">

      {/* ================= HERO ================= */}

      <section className="hero">

        {/* PARALLAX MESH */}
        <div
          className="mesh"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        ></div>

        <div className="hero-wrapper">

          {/* LEFT TEXT */}
          <div className="hero-text">

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
            >
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.6 }}
                  className="word"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              Manage project rooms, assign mentors, schedule demos,
              and certify students — all in one intelligent platform.
            </motion.p>

            <div className="hero-buttons">
              <Link to="/register" className="cta">
                Start Building
              </Link>
              <Link to="/about" className="outline-btn">
                Learn More
              </Link>
            </div>
          </div>

          {/* RIGHT SVG WITH PARALLAX */}
          <div
            className="hero-illustration"
            style={{ transform: `translateY(${scrollY * -0.15}px)` }}
          >
            <svg viewBox="0 0 500 400" className="floating-svg">
              <circle cx="250" cy="200" r="120" fill="#3b82f6" opacity="0.15" />
              <rect x="150" y="120" width="200" height="160" rx="20" fill="#1e293b" />
              <circle cx="200" cy="170" r="20" fill="#6366f1" />
              <circle cx="250" cy="170" r="20" fill="#9333ea" />
              <circle cx="300" cy="170" r="20" fill="#3b82f6" />
              <rect x="190" y="220" width="120" height="20" rx="5" fill="#94a3b8" />
            </svg>
          </div>

        </div>

        {/* WAVE DIVIDER */}
        <div className="wave-divider">
          <svg viewBox="0 0 1440 200">
            <path
              fill="#111827"
              d="M0,128L80,133.3C160,139,320,149,480,133.3C640,117,800,75,960,69.3C1120,64,1280,96,1360,112L1440,128L1440,200L0,200Z"
            ></path>
          </svg>
        </div>

      </section>


      {/* ================= STATS ================= */}

      <section className="stats">

        <motion.div
          className="stat"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2><CountUp end={200} duration={3} />+</h2>
          <p>Projects Managed</p>
        </motion.div>

        <motion.div
          className="stat"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2><CountUp end={150} duration={3} />+</h2>
          <p>Active Mentors</p>
        </motion.div>

        <motion.div
          className="stat"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2><CountUp end={5000} duration={3} />+</h2>
          <p>Students Registered</p>
        </motion.div>

      </section>


      {/* ================= FEATURES ================= */}

      <section className="features">

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h3>Smart Project Rooms</h3>
          <p>Create and manage collaborative team projects efficiently.</p>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>Mentor Workflow</h3>
          <p>Request mentors, assign tasks and schedule reviews.</p>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3>Certification Engine</h3>
          <p>Automated validation and approval system.</p>
        </motion.div>

      </section>

      
     {/* ================= FINAL CTA ================= */}

      <section className="final-cta">
        <h2>Ready to Transform Your College Projects?</h2>
        <Link to="/register" className="cta">
          Get Started Today
        </Link>
      </section>


      {/* ================= FOOTER ================= */}

      <footer className="footer">
        © 2026 Adhiyamaan College of Engineering. All Rights Reserved.
      </footer>


    </div>
  );
}

export default Home;
import { motion } from "framer-motion";
import "../styles/about.css";

function About() {
  return (
    <div className="meta-container">

      {/* HERO SECTION */}
      <section className="meta-hero">

        <div className="meta-bg"></div>

        {/* Floating Orbs */}
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>

        <motion.div
          className="meta-content"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1>
            The Future of <span>Project Collaboration</span>
          </h1>

          <p>
            A next-generation digital ecosystem transforming
            how students, mentors, and administrators collaborate.
          </p>
        </motion.div>

        {/* Floating Info Cards */}
        <div className="floating-card card1">
          <h4>Active Projects</h4>
          <p>200+</p>
        </div>

        <div className="floating-card card2">
          <h4>Mentors</h4>
          <p>150+</p>
        </div>

        <div className="floating-card card3">
          <h4>Certified</h4>
          <p>5000+</p>
        </div>

      </section>

      {/* BELOW SECTION */}
      <section className="meta-info">
        <h2>Why Adhiyamaan Project Collab?</h2>

        <div className="meta-grid">

          <div className="meta-box">
            <h3>Secure Platform</h3>
            <p>Structured workflow from creation to certification.</p>
          </div>

          <div className="meta-box">
            <h3>Smart Workflow</h3>
            <p>Mentor requests, demo scheduling and validation system.</p>
          </div>

          <div className="meta-box">
            <h3>Real-Time Monitoring</h3>
            <p>Track progress with intelligent dashboards.</p>
          </div>

        </div>
      </section>

    </div>
  );
}

export default About;
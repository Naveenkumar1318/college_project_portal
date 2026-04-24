import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Hero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const words = "The Future of College Project Collaboration".split(" ");

  return (
    <section className="hero">
      <div
        className="mesh"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      />

      <div className="hero-wrapper">

        <div className="hero-text">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08 } }
            }}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                className="word"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Manage project rooms, assign mentors, track progress and certify students.
          </motion.p>

          <div className="hero-buttons">
            <Link to="/register" className="cta">Start Building</Link>
          </div>
        </div>

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
    </section>
  );
};

export default Hero;
import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <section className="final-cta">
      <h2>Ready to Build Your Project?</h2>
      <Link to="/register" className="cta">Get Started</Link>
    </section>
  );
};

export default FinalCTA;
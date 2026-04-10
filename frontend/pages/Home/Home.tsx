import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Features from "./components/Features";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import "../../styles/pages/home/home.css";

const Home = () => {
  return (
    <div className="premium">
      <Hero />
      <Stats />
      <Features />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Home;
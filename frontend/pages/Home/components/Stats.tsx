import { useEffect, useState } from "react";
import { getDashboardStats } from "../../../services/dashboard.service";

type StatsType = {
  students: number;
  mentors: number;
  projects: number;
};

const Stats = () => {
  const [stats, setStats] = useState<StatsType>({
    students: 0,
    mentors: 0,
    projects: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="stats">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="stat">
            <h2>{stats.projects}+</h2>
            <p>Projects Managed</p>
          </div>

          <div className="stat">
            <h2>{stats.mentors}+</h2>
            <p>Mentors</p>
          </div>

          <div className="stat">
            <h2>{stats.students}+</h2>
            <p>Students</p>
          </div>
        </>
      )}
    </section>
  );
};

export default Stats;
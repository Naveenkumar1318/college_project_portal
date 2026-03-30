import { useEffect, useState } from "react";
import api from "../../../services/api";

const MentorDashboard = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setData(res.data);
      } catch (err) {
        console.error("Mentor dashboard error:", err);
      }
    };

    fetchDashboard();
  }, []);

  if (!data) return <p>Loading mentor dashboard...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
    </div>
  );
};

export default MentorDashboard;
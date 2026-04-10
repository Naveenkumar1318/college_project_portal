import { useEffect, useState } from "react";
import api from "../../../services/api";

interface DashboardData {
  projects: number;
  mentors: number;
  students: number;
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setData(res.data);
      } catch (err) {
        console.error("Admin dashboard error:", err);
      }
    };

    fetchDashboard();
  }, []);

  if (!data) return <p>Loading admin dashboard...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Projects" value={data.projects} />
        <Card title="Mentors" value={data.mentors} />
        <Card title="Students" value={data.students} />
      </div>
    </div>
  );
};

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-white p-5 rounded-xl shadow">
    <h3 className="text-gray-500">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default AdminDashboard;
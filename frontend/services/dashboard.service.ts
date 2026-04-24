import api from "./api";

export type DashboardStats = {
  students: number;
  mentors: number;
  projects: number;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const res = await api.get("/dashboard/stats"); // ✅ FIXED
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { detail: "Failed to fetch stats" };
  }
};
import api from "./api";

export const createProject = (data: {
  title: string;
  description: string;
}) => {
  return api.post("/projects", data);
};
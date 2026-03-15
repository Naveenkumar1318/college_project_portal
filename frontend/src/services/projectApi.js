import API from "./api";

/* ================= OWN PROJECTS ================= */

export const getOwnProjects = async () => {
  const res = await API.get("/projects/own");
  return res.data;
};

/* ================= WORK PROJECTS ================= */

export const getWorkProjects = async () => {
  const res = await API.get("/projects/work");
  return res.data;
};

/* ================= PROJECT DETAIL ================= */

export const getProjectDetail = async (id) => {
  const res = await API.get(`/projects/${id}`);
  return res.data;
};

/* ================= UPDATE STATUS ================= */

export const updateProjectStatus = async (id, status) => {
  const res = await API.put(`/projects/${id}/status`, { status });
  return res.data;
};

/* ================= COMPLETE PROJECT ================= */

export const completeProject = async (id) => {
  const res = await API.put(`/projects/${id}/complete`);
  return res.data;
};

/* ================= REMOVE MEMBER ================= */

export const removeMember = async (projectId, studentId) => {
  const res = await API.delete(
    `/projects/${projectId}/remove/${studentId}`
  );
  return res.data;
};

/* ================= ACCEPT REQUEST ================= */

export const acceptRequest = async (projectId, studentId) => {
  const res = await API.post(
    `/projects/${projectId}/accept/${studentId}`
  );
  return res.data;
};

/* ================= DELETE PROJECT ================= */

export const deleteProject = async (projectId) => {
  const res = await API.delete(
    `/projects/delete/${projectId}`
  );
  return res.data;
};
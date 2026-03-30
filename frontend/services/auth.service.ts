import api from "./api";

export type RegisterPayload = {
  id: string;
  email: string;
  password: string;
  role: string;
};

export type LoginPayload = {
  id: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  role: string;
};

// REGISTER
export const registerUser = async (
  data: RegisterPayload
): Promise<any> => {
  try {
    const res = await api.post("/auth/register", data); // ✅ FIXED
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { detail: "Registration failed" };
  }
};

// LOGIN
export const loginUser = async (
  data: LoginPayload
): Promise<AuthResponse> => {
  try {
    const res = await api.post("/auth/login", data); // ✅ FIXED
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { detail: "Login failed" };
  }
};
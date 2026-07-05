import { axiosClient } from "../api/axiosClient";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "VIEWER";
  department?: { id: string; name: string } | null;
}

export class AuthService {
  static async login(email: string, password: string): Promise<User> {
    const res = await axiosClient.post("/auth/login", { email, password });
    const { user, accessToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    return user;
  }

  static async register(fullName: string, email: string, password: string, departmentId?: string): Promise<User> {
    const res = await axiosClient.post("/auth/register", {
      fullName,
      email,
      password,
      departmentId: departmentId || undefined,
    });
    const { user, accessToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    return user;
  }

  static async logout(): Promise<void> {
    try {
      await axiosClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
    }
  }

  static async getMe(): Promise<User> {
    const res = await axiosClient.get("/auth/me");
    return res.data.data.user;
  }

  static async getUsers(): Promise<{ id: string; fullName: string; email: string }[]> {
    const res = await axiosClient.get("/auth/users");
    return res.data.data.users;
  }

  static async updateUserRole(userId: string, role: "ADMIN" | "MANAGER" | "VIEWER"): Promise<User> {
    const res = await axiosClient.put(`/auth/users/${userId}/role`, { role });
    return res.data.data.user;
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
  }
}

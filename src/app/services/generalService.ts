import { axiosClient } from "../api/axiosClient";

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  _count?: { records: number };
}

export interface DepartmentItem {
  id: string;
  name: string;
}

export class GeneralService {
  static async getCategories(): Promise<CategoryItem[]> {
    const res = await axiosClient.get("/categories");
    return res.data.data.categories;
  }

  static async getDepartments(): Promise<DepartmentItem[]> {
    const res = await axiosClient.get("/departments");
    return res.data.data.departments;
  }
}

import { axiosClient } from "../api/axiosClient";

export interface RecordItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category: { id: string; name: string; color: string };
  ownerId: string;
  owner: { id: string; fullName: string; email: string };
  departmentId: string;
  department: { id: string; name: string };
  vendor?: string;
  documentNumber?: string;
  issueDate: string;
  expiryDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  remarks?: string;
  attachmentUrl?: string;
  daysLeft: number;
  status: "Active" | "Expiring" | "Critical" | "Expired";
  createdAt: string;
  updatedAt: string;
}

export interface FetchRecordsResponse {
  records: RecordItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class RecordsService {
  static async getRecords(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    department?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<FetchRecordsResponse> {
    const res = await axiosClient.get("/records", { params });
    return res.data;
  }

  static async getRecordById(id: string): Promise<RecordItem> {
    const res = await axiosClient.get(`/records/${id}`);
    return res.data.data.record;
  }

  static async createRecord(formData: FormData): Promise<RecordItem> {
    const res = await axiosClient.post("/records", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data.record;
  }

  static async updateRecord(id: string, formData: FormData): Promise<RecordItem> {
    const res = await axiosClient.put(`/records/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data.record;
  }

  static async renewRecord(id: string, newExpiry: string, remarks?: string): Promise<RecordItem> {
    const res = await axiosClient.post(`/records/${id}/renew`, { newExpiry, remarks });
    return res.data.data.record;
  }

  static async deleteRecord(id: string): Promise<void> {
    await axiosClient.delete(`/records/${id}`);
  }
}

import { axiosClient } from "../api/axiosClient";

export interface ExtractedInfo {
  recordName: string;
  category: string;
  vendor: string;
  issueDate: string;
  expiryDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  documentNumber: string;
  department: string;
  description: string;
  confidence: Record<string, number>;
  warnings: string[];
  summary: string;
  isDuplicate: boolean;
}

export class AIService {
  static async extractDocument(file: File): Promise<ExtractedInfo> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosClient.post("/ai/extract-document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.data.extracted;
  }
}

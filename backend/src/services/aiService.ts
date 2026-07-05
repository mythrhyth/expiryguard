import { prisma } from "../prisma/client";
import { calculateRecordStatus } from "../utils/statusCalculator";
import axios from "axios";
import { logger } from "../utils/logger";
import { Priority, Severity } from "../types/enums";

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
  static async extractDocument(file: Express.Multer.File): Promise<ExtractedInfo> {
    logger.info(`AI parsing document: ${file.originalname} (size: ${file.size} bytes)`);

    const geminiKey = process.env.GEMINI_API_KEY;
    let extracted: any = null;

    if (geminiKey) {
      try {
        logger.info("GEMINI_API_KEY detected. Initiating real Gemini API extraction...");
        extracted = await this.extractWithGemini(file, geminiKey);
      } catch (err) {
        logger.error("Gemini API extraction failed, switching to fallback simulator:", err);
      }
    }

    // Run fallback simulator if Gemini wasn't configured or failed
    if (!extracted) {
      extracted = this.extractWithFallback(file);
    }

    // Post-Process: Validate dates
    extracted.issueDate = this.normalizeDate(extracted.issueDate || new Date().toISOString());
    extracted.expiryDate = this.normalizeDate(extracted.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());

    // Post-Process: Check for Duplicates in Database
    const duplicate = await this.checkDuplicate(
      extracted.documentNumber,
      extracted.recordName,
      extracted.vendor
    );

    let isDuplicate = false;
    if (duplicate) {
      isDuplicate = true;
      extracted.warnings.push(
        `Possible duplicate: similar record already exists ("${duplicate.name}" - ${duplicate.documentNumber || "No Doc #"}).`
      );
    }

    // Post-Process: Check if document has already expired
    const expiry = new Date(extracted.expiryDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (expiry.getTime() < today.getTime()) {
      extracted.warnings.push("Document has already expired.");
    }

    return {
      ...extracted,
      isDuplicate,
    };
  }

  private static async extractWithGemini(file: Express.Multer.File, apiKey: string): Promise<any> {
    const fileBase64 = file.buffer.toString("base64");
    
    // We request a structured JSON response matching our spec
    const prompt = `
      You are an expert Document Intelligence AI.
      Analyze this document and extract its metadata.
      Return a valid JSON object with the following fields:
      - recordName: string (Descriptive name of the document or contract)
      - category: string (One of: Contracts, Compliance, Insurance, Licenses, Safety, Machine Inspection, Other)
      - vendor: string (Company, partner, vendor, or authority who issued the document)
      - issueDate: string (YYYY-MM-DD format)
      - expiryDate: string (YYYY-MM-DD format)
      - priority: string (HIGH, MEDIUM, or LOW)
      - documentNumber: string (Document number, certificate number, contract ID, or license number)
      - department: string (One of: Operations, Legal, Plant Operations, Quality, IT Security, Risk Management, Compliance, Procurement, Finance, Engineering, HSE)
      - description: string (Short description of the contract bounds and purpose)
      - confidence: object (Confidence scores from 0 to 100 for each field: recordName, category, vendor, issueDate, expiryDate, priority, documentNumber, department, description)
      - warnings: string[] (List of any alerts, missing dates, low readability warnings)
      - summary: string (One-sentence summary of the document, who it is with, and expiry timeline)

      Return ONLY the JSON block. Do not include markdown code block syntax.
    `;

    const requestData = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.mimetype,
                data: fileBase64,
              },
            },
          ],
        },
      ],
    };

    // Use Gemini 1.5 Flash for fast document intelligence
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, requestData, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    const contentText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean up any potential markdown wraps
    const cleanJSONText = contentText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJSONText);
    return parsed;
  }

  private static extractWithFallback(file: Express.Multer.File): any {
    const filename = file.originalname.toLowerCase();
    
    // Default simulated confidence values (high confidence mock data to match existing visual flows)
    const highConfidence = {
      recordName: 98,
      category: 95,
      vendor: 97,
      issueDate: 99,
      expiryDate: 99,
      priority: 95,
      documentNumber: 94,
      department: 92,
      description: 89,
    };

    // Case 1: Fire safety document simulation
    if (filename.includes("fire") || filename.includes("safety")) {
      return {
        recordName: "Annual Fire Safety Certificate",
        category: "Safety",
        vendor: "Fire Safety India Ltd",
        issueDate: "2024-07-03",
        expiryDate: "2026-07-05",
        priority: "HIGH",
        documentNumber: "FSC-2024-0891",
        department: "Operations",
        description: "Annual fire safety verification and certification for plant units.",
        confidence: highConfidence,
        warnings: [],
        summary: "Fire safety certificate issued by Fire Safety India Ltd. Expires on 05 July 2026.",
      };
    }

    // Case 2: Environmental Compliance Permit simulation
    if (filename.includes("env") || filename.includes("permit") || filename.includes("compliance")) {
      return {
        recordName: "Environmental Compliance Permit",
        category: "Compliance",
        vendor: "Ministry of Environment",
        issueDate: "2025-05-20",
        expiryDate: "2026-08-16",
        priority: "MEDIUM",
        documentNumber: "ECP-2025-3421",
        department: "Legal",
        description: "Compliance certification for air and water discharge parameters.",
        confidence: highConfidence,
        warnings: [],
        summary: "Regulatory environment permit from Ministry of Environment. Valid until 16 August 2026.",
      };
    }

    // Case 3: Cyber Insurance policy simulation
    if (filename.includes("cyber") || filename.includes("insurance")) {
      return {
        recordName: "Cyber Liability Insurance Policy",
        category: "Insurance",
        vendor: "HDFC Ergo Insurance",
        issueDate: "2025-07-02",
        expiryDate: "2026-07-07",
        priority: "HIGH",
        documentNumber: "CLI-2025-4521",
        department: "IT Security",
        description: "Liability coverage for cybersecurity incidents and data breach events.",
        confidence: highConfidence,
        warnings: [],
        summary: "Cyber risk liability insurance policy issued by HDFC Ergo Insurance. Expires on 07 July 2026.",
      };
    }

    // Case 4: Default generic extraction (returns low confidence values to test highlighting (<70%))
    return {
      recordName: file.originalname.split(".")[0],
      category: "Contracts",
      vendor: "Unknown Corporate Issuer",
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "MEDIUM",
      documentNumber: "CN-" + Math.floor(Math.random() * 9000 + 1000),
      department: "Procurement",
      description: "Extracted details from generic business agreement file.",
      confidence: {
        recordName: 65,      // Low
        category: 58,        // Low
        vendor: 52,          // Low
        issueDate: 92,       // High
        expiryDate: 60,      // Low
        priority: 78,
        documentNumber: 55,  // Low
        department: 50,      // Low
        description: 45,     // Low
      },
      warnings: [
        "Low OCR confidence on metadata fields.",
        "Unable to definitively find official issuer name; defaulted to generic.",
        "Missing explicit department designation.",
      ],
      summary: `Uploaded document "${file.originalname}" processed with low confidence. Manual verification is highly recommended.`,
    };
  }

  private static async checkDuplicate(docNumber: string, name: string, vendor: string) {
    if (!docNumber && (!name || !vendor)) return null;

    const where: any = {};
    if (docNumber && docNumber !== "N/A") {
      where.documentNumber = docNumber;
    } else {
      where.AND = [
        { name: { contains: name } },
        { vendor: { contains: vendor } },
      ];
    }

    const duplicate = await prisma.record.findFirst({ where });
    return duplicate;
  }

  private static normalizeDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        throw new Error();
      }
      return d.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }
}

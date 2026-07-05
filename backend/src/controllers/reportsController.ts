import { Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import { calculateRecordStatus } from "../utils/statusCalculator";
import { Prisma } from "@prisma/client";
import { Priority } from "../types/enums";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { AuthenticatedRequest } from "../types";

export class ReportsController {
  static async exportReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { format = "csv", search, status, category, department, priority } = req.query;

      // 1. Build DB filter matching Records list
      const where: Prisma.RecordWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { vendor: { contains: search as string } },
          { documentNumber: { contains: search as string } },
          { owner: { fullName: { contains: search as string } } },
        ];
      }

      if (department && department !== "All") {
        where.department = { name: { equals: department as string } };
      }

      if (category && category !== "All") {
        where.category = { name: { equals: category as string } };
      }

      if (priority && priority !== "All") {
        where.priority = (priority as string).toUpperCase() as Priority;
      }

      if (status && status !== "All") {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const d7 = new Date(today);
        d7.setUTCDate(today.getUTCDate() + 7);

        const d8 = new Date(today);
        d8.setUTCDate(today.getUTCDate() + 8);

        const d30 = new Date(today);
        d30.setUTCDate(today.getUTCDate() + 30);

        if (status === "Expired") {
          where.expiryDate = { lt: today };
        } else if (status === "Critical") {
          where.expiryDate = { gte: today, lte: d7 };
        } else if (status === "Expiring") {
          where.expiryDate = { gte: d8, lte: d30 };
        } else if (status === "Active") {
          where.expiryDate = { gt: d30 };
        }
      }

      // Fetch records
      const records = await prisma.record.findMany({
        where,
        include: {
          category: true,
          department: true,
          owner: { select: { fullName: true, email: true } },
        },
        orderBy: { expiryDate: "asc" },
      });

      // Map computed fields
      const formattedRecords = records.map((r) => {
        const { daysLeft, status: computedStatus } = calculateRecordStatus(r.expiryDate);
        return {
          name: r.name,
          docNumber: r.documentNumber || "N/A",
          category: r.category.name,
          department: r.department.name,
          owner: r.owner.fullName,
          issueDate: r.issueDate.toISOString().split("T")[0],
          expiryDate: r.expiryDate.toISOString().split("T")[0],
          daysLeft,
          priority: r.priority,
          status: computedStatus,
          vendor: r.vendor || "N/A",
        };
      });

      // 2. Export based on requested format
      if (format === "excel" || format === "xlsx") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("ExpiryGuard Records");

        // Styling headers
        worksheet.columns = [
          { header: "Document Name", key: "name", width: 30 },
          { header: "Doc Number", key: "docNumber", width: 15 },
          { header: "Category", key: "category", width: 15 },
          { header: "Department", key: "department", width: 15 },
          { header: "Owner", key: "owner", width: 20 },
          { header: "Issue Date", key: "issueDate", width: 12 },
          { header: "Expiry Date", key: "expiryDate", width: 12 },
          { header: "Days Left", key: "daysLeft", width: 10 },
          { header: "Priority", key: "priority", width: 10 },
          { header: "Status", key: "status", width: 15 },
          { header: "Vendor/Authority", key: "vendor", width: 20 },
        ];

        // Format header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2563EB" }, // Blue-600
        };

        // Add records
        formattedRecords.forEach((item) => {
          worksheet.addRow(item);
        });

        // Setup response headers
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=expiryguard_compliance_report.xlsx"
        );

        await workbook.xlsx.write(res);
        return res.end();
      } else if (format === "pdf") {
        const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=expiryguard_compliance_report.pdf"
        );

        doc.pipe(res);

        // PDF Header styling
        doc.fillColor("#1E3A8A").fontSize(20).text("ExpiryGuard Enterprise Compliance Report", { align: "center" });
        doc.fontSize(10).fillColor("#6B7280").text(`Generated on: ${new Date().toLocaleDateString()} | Filtered Dataset`, { align: "center" });
        doc.moveDown(2);

        // Draw Table Header
        let y = doc.y;
        doc.fillColor("#000000").fontSize(9);
        
        const cols = [
          { label: "Document Name", x: 40, w: 150 },
          { label: "Doc #", x: 190, w: 70 },
          { label: "Category", x: 260, w: 70 },
          { label: "Department", x: 330, w: 70 },
          { label: "Owner", x: 400, w: 80 },
          { label: "Expiry Date", x: 480, w: 70 },
          { label: "Days Left", x: 550, w: 50 },
          { label: "Priority", x: 600, w: 50 },
          { label: "Status", x: 650, w: 60 },
        ];

        // Draw Header Border & Background Line
        doc.rect(40, y - 5, 750, 20).fill("#F3F4F6");
        doc.fillColor("#111827");
        cols.forEach((col) => {
          doc.text(col.label, col.x, y);
        });
        doc.moveDown(1);
        y += 20;

        // Draw rows
        formattedRecords.forEach((item, index) => {
          if (y > doc.page.height - 60) {
            doc.addPage({ layout: "landscape" });
            y = 40;
            // Draw headers again on new page
            doc.rect(40, y - 5, 750, 20).fill("#F3F4F6");
            doc.fillColor("#111827");
            cols.forEach((col) => {
              doc.text(col.label, col.x, y);
            });
            y += 20;
          }

          // Alternate row backgrounds
          if (index % 2 === 0) {
            doc.rect(40, y - 4, 750, 16).fill("#F9FAFB");
          }

          doc.fillColor("#374151");
          doc.text(item.name.substring(0, 28) + (item.name.length > 28 ? "..." : ""), 40, y);
          doc.text(item.docNumber, 190, y);
          doc.text(item.category, 260, y);
          doc.text(item.department, 330, y);
          doc.text(item.owner.substring(0, 15), 400, y);
          doc.text(item.expiryDate, 480, y);
          
          // Color daysLeft based on criticality
          if (item.daysLeft < 0) {
            doc.fillColor("#9CA3AF"); // gray
          } else if (item.daysLeft <= 7) {
            doc.fillColor("#DC2626"); // red
          } else if (item.daysLeft <= 30) {
            doc.fillColor("#D97706"); // orange
          } else {
            doc.fillColor("#16A34A"); // green
          }
          doc.text(String(item.daysLeft), 550, y);
          
          doc.fillColor("#374151");
          doc.text(item.priority, 600, y);
          doc.text(item.status, 650, y);

          y += 16;
        });

        doc.end();
        return;
      } else {
        // Default to CSV
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=expiryguard_compliance_report.csv"
        );

        let csv = "Document Name,Document Number,Category,Department,Owner,Issue Date,Expiry Date,Days Left,Priority,Status,Vendor\n";
        formattedRecords.forEach((item) => {
          // Escape quotes in CSV
          const name = `"${item.name.replace(/"/g, '""')}"`;
          const docNumber = `"${item.docNumber.replace(/"/g, '""')}"`;
          const category = `"${item.category.replace(/"/g, '""')}"`;
          const department = `"${item.department.replace(/"/g, '""')}"`;
          const owner = `"${item.owner.replace(/"/g, '""')}"`;
          const vendor = `"${item.vendor.replace(/"/g, '""')}"`;

          csv += `${name},${docNumber},${category},${department},${owner},${item.issueDate},${item.expiryDate},${item.daysLeft},${item.priority},${item.status},${vendor}\n`;
        });

        return res.status(200).send(csv);
      }
    } catch (error) {
      next(error);
    }
  }
}

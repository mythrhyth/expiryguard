import { prisma } from "../prisma/client";
import { createRecordSchema, updateRecordSchema, renewRecordSchema } from "../validators/recordValidator";
import { AppError } from "../utils/appError";
import { calculateRecordStatus } from "../utils/statusCalculator";
import { Prisma } from "@prisma/client";
import { Priority } from "../types/enums";

export class RecordsService {
  static async getRecords(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 8;
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      category,
      department,
      priority,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const where: Prisma.RecordWhereInput = {};

    // 1. Search Query (Global Search across multiple fields)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { vendor: { contains: search } },
        { documentNumber: { contains: search } },
        { owner: { fullName: { contains: search } } },
        { category: { name: { contains: search } } },
        { department: { name: { contains: search } } },
      ];
    }

    // 2. Department Filter (supports department name or ID)
    if (department && department !== "All") {
      where.department = {
        name: { equals: department },
      };
    }

    // 3. Category Filter
    if (category && category !== "All") {
      where.category = {
        name: { equals: category },
      };
    }

    // 4. Priority Filter
    if (priority && priority !== "All") {
      where.priority = priority.toUpperCase() as Priority;
    }

    // 5. Expiry Status Filter (Mapped to date ranges for performance)
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

    // 6. Sorting Map
    let orderBy: Prisma.RecordOrderByWithRelationInput = {};
    if (sortBy === "category") {
      orderBy = { category: { name: sortOrder } };
    } else if (sortBy === "department") {
      orderBy = { department: { name: sortOrder } };
    } else if (sortBy === "owner") {
      orderBy = { owner: { fullName: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Execute queries
    const [total, records] = await prisma.$transaction([
      prisma.record.count({ where }),
      prisma.record.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          department: true,
          owner: { select: { id: true, fullName: true, email: true } },
          creator: { select: { id: true, fullName: true } },
          updater: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    // Map computed status and daysLeft to results
    const recordsWithStatus = records.map((record) => {
      const { daysLeft, status: computedStatus } = calculateRecordStatus(record.expiryDate);
      return {
        ...record,
        daysLeft,
        status: computedStatus,
      };
    });

    return {
      records: recordsWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getRecordById(id: string) {
    const record = await prisma.record.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        owner: { select: { id: true, fullName: true, email: true } },
        creator: { select: { id: true, fullName: true } },
        updater: { select: { id: true, fullName: true } },
        renewalHistories: {
          orderBy: { renewedAt: "desc" },
          include: { renewedBy: { select: { fullName: true } } },
        },
      },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    const { daysLeft, status } = calculateRecordStatus(record.expiryDate);
    return {
      ...record,
      daysLeft,
      status,
    };
  }

  static async createRecord(data: any, createdById: string, userName: string) {
    const parsed = createRecordSchema.parse(data);

    const record = await prisma.record.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        categoryId: parsed.categoryId,
        ownerId: parsed.ownerId,
        departmentId: parsed.departmentId,
        vendor: parsed.vendor,
        documentNumber: parsed.documentNumber,
        issueDate: parsed.issueDate,
        expiryDate: parsed.expiryDate,
        priority: parsed.priority,
        remarks: parsed.remarks,
        attachmentUrl: data.attachmentUrl,
        createdById,
      },
      include: {
        category: true,
        department: true,
        owner: { select: { fullName: true } },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: "Created",
        recordId: record.id,
        recordName: record.name,
        userId: createdById,
        userName,
        details: `Created record ${record.name} under ${record.category.name} for ${record.department.name}.`,
      },
    });

    return record;
  }

  static async updateRecord(id: string, data: any, updatedById: string, userName: string) {
    const parsed = updateRecordSchema.parse(data);

    // Verify record exists
    const recordExists = await prisma.record.findUnique({ where: { id } });
    if (!recordExists) {
      throw new AppError("Record not found", 404);
    }

    const record = await prisma.record.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description,
        categoryId: parsed.categoryId,
        ownerId: parsed.ownerId,
        departmentId: parsed.departmentId,
        vendor: parsed.vendor,
        documentNumber: parsed.documentNumber,
        issueDate: parsed.issueDate,
        expiryDate: parsed.expiryDate,
        priority: parsed.priority,
        remarks: parsed.remarks,
        attachmentUrl: data.attachmentUrl !== undefined ? data.attachmentUrl : undefined,
        updatedById,
      },
      include: {
        category: true,
        department: true,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: "Updated",
        recordId: record.id,
        recordName: record.name,
        userId: updatedById,
        userName,
        details: `Updated metadata for record: ${record.name}.`,
      },
    });

    return record;
  }

  static async renewRecord(id: string, data: any, renewedById: string, userName: string) {
    const parsed = renewRecordSchema.parse(data);

    // Fetch existing record
    const record = await prisma.record.findUnique({ where: { id } });
    if (!record) {
      throw new AppError("Record not found", 404);
    }

    const previousExpiry = record.expiryDate;
    const newExpiry = parsed.newExpiry;

    // Use transaction to preserve history integrity
    const updatedRecord = await prisma.$transaction(async (tx) => {
      // 1. Create history log
      await tx.renewalHistory.create({
        data: {
          recordId: id,
          previousExpiry,
          newExpiry,
          remarks: parsed.remarks || "Record renewed.",
          renewedById,
        },
      });

      // 2. Update record dates (set issueDate to today, expiryDate to newExpiry)
      return tx.record.update({
        where: { id },
        data: {
          issueDate: new Date(),
          expiryDate: newExpiry,
          updatedById: renewedById,
        },
        include: {
          category: true,
        },
      });
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: "Renewed",
        recordId: id,
        recordName: updatedRecord.name,
        userId: renewedById,
        userName,
        details: `Renewed record ${updatedRecord.name} (New Expiry: ${newExpiry.toISOString().split("T")[0]}).`,
      },
    });

    const statusInfo = calculateRecordStatus(updatedRecord.expiryDate);
    return {
      ...updatedRecord,
      ...statusInfo,
    };
  }

  static async deleteRecord(id: string, userId: string, userName: string) {
    const record = await prisma.record.findUnique({ where: { id } });
    if (!record) {
      throw new AppError("Record not found", 404);
    }

    await prisma.record.delete({ where: { id } });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: "Deleted",
        recordId: id,
        recordName: record.name,
        userId,
        userName,
        details: `Permanently deleted record ${record.name}.`,
      },
    });

    return { id, name: record.name };
  }
}

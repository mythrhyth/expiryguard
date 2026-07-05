import { PrismaClient } from "@prisma/client";
import { Role, Priority, Severity } from "../src/types/enums";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.renewalHistory.deleteMany();
  await prisma.record.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create Departments
  const deptNames = [
    "Operations",
    "Legal",
    "Plant Operations",
    "Quality",
    "IT Security",
    "Risk Management",
    "Compliance",
    "Procurement",
    "Finance",
    "Engineering",
    "HSE",
  ];
  const depts: Record<string, any> = {};
  for (const name of deptNames) {
    depts[name] = await prisma.department.create({ data: { name } });
  }

  // Create Users with Hashed Passwords
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
  const userData = [
    { fullName: "Rohan Mehta", email: "rohan@tatasteel.com", role: Role.ADMIN, departmentName: "Compliance" },
    { fullName: "Priya Sharma", email: "priya@tatasteel.com", role: Role.MANAGER, departmentName: "Legal" },
    { fullName: "Amit Patel", email: "amit@tatasteel.com", role: Role.MANAGER, departmentName: "Plant Operations" },
    { fullName: "Sunita Rao", email: "sunita@tatasteel.com", role: Role.VIEWER, departmentName: "Quality" },
    { fullName: "Vikram Singh", email: "vikram@tatasteel.com", role: Role.VIEWER, departmentName: "Operations" },
    { fullName: "Rajesh Kumar", email: "rajesh@tatasteel.com", role: Role.MANAGER, departmentName: "Operations" },
    { fullName: "Neha Gupta", email: "neha@tatasteel.com", role: Role.MANAGER, departmentName: "IT Security" },
    { fullName: "Arjun Mehta", email: "arjun@tatasteel.com", role: Role.MANAGER, departmentName: "Risk Management" },
    { fullName: "Ravi Verma", email: "ravi@tatasteel.com", role: Role.MANAGER, departmentName: "Compliance" },
    { fullName: "Sneha Joshi", email: "sneha@tatasteel.com", role: Role.MANAGER, departmentName: "Procurement" },
    { fullName: "Karan Shah", email: "karan@tatasteel.com", role: Role.MANAGER, departmentName: "Finance" },
    { fullName: "Dinesh Tiwari", email: "dinesh@tatasteel.com", role: Role.MANAGER, departmentName: "Engineering" },
    { fullName: "Meena Pillai", email: "meena@tatasteel.com", role: Role.MANAGER, departmentName: "HSE" },
  ];

  const users: Record<string, any> = {};
  for (const u of userData) {
    users[u.fullName] = await prisma.user.create({
      data: {
        fullName: u.fullName,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: u.role,
        departmentId: depts[u.departmentName]?.id || null,
      },
    });
  }

  // Create Categories with colors matching frontend
  const categoriesData = [
    { name: "Contracts", description: "Vendor, supplier and procurement agreements", color: "#2563EB" },
    { name: "Compliance", description: "Regulatory, environment, and statutory audits", color: "#7C3AED" },
    { name: "Insurance", description: "Corporate and asset risk policies", color: "#0891B2" },
    { name: "Licenses", description: "Operating and factory licenses", color: "#059669" },
    { name: "Safety", description: "Fire, health, safety, and environment files", color: "#D97706" },
    { name: "Machine Inspection", description: "Calibration, equipment and boiler checklists", color: "#DC2626" },
    { name: "Other", description: "Miscellaneous records", color: "#6B7280" },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.name] = await prisma.category.create({ data: cat });
  }

  // Create Records matching mock data
  const recordsData = [
    {
      name: "Annual Fire Safety Certificate",
      category: "Safety",
      department: "Operations",
      owner: "Rajesh Kumar",
      vendor: "Fire Safety India Ltd",
      issueDate: new Date("2024-07-03T00:00:00Z"),
      expiryDate: new Date("2026-07-05T00:00:00Z"),
      priority: Priority.HIGH,
      documentNumber: "FSC-2024-0891",
    },
    {
      name: "Environmental Compliance Permit",
      category: "Compliance",
      department: "Legal",
      owner: "Priya Sharma",
      vendor: "Ministry of Environment",
      issueDate: new Date("2025-05-20T00:00:00Z"),
      expiryDate: new Date("2026-08-16T00:00:00Z"),
      priority: Priority.MEDIUM,
      documentNumber: "ECP-2025-3421",
    },
    {
      name: "Boiler Inspection Certificate",
      category: "Machine Inspection",
      department: "Plant Operations",
      owner: "Amit Patel",
      vendor: "Bureau of Indian Standards",
      issueDate: new Date("2025-06-20T00:00:00Z"),
      expiryDate: new Date("2026-07-14T00:00:00Z"),
      priority: Priority.HIGH,
      documentNumber: "BIC-2025-0234",
    },
    {
      name: "ISO 9001:2015 Certification",
      category: "Compliance",
      department: "Quality",
      owner: "Sunita Rao",
      vendor: "Bureau Veritas",
      issueDate: new Date("2023-12-15T00:00:00Z"),
      expiryDate: new Date("2026-12-27T00:00:00Z"),
      priority: Priority.LOW,
      documentNumber: "ISO-2023-7821",
    },
    {
      name: "Port Operating License",
      category: "Licenses",
      department: "Operations",
      owner: "Vikram Singh",
      vendor: "Ministry of Ports",
      issueDate: new Date("2024-01-10T00:00:00Z"),
      expiryDate: new Date("2026-07-20T00:00:00Z"),
      priority: Priority.HIGH,
      documentNumber: "POL-2024-0056",
    },
    {
      name: "Cyber Liability Insurance Policy",
      category: "Insurance",
      department: "IT Security",
      owner: "Neha Gupta",
      vendor: "HDFC Ergo Insurance",
      issueDate: new Date("2025-07-02T00:00:00Z"),
      expiryDate: new Date("2026-07-07T00:00:00Z"),
      priority: Priority.HIGH,
      documentNumber: "CLI-2025-4521",
    },
    {
      name: "Professional Indemnity Insurance",
      category: "Insurance",
      department: "Risk Management",
      owner: "Arjun Mehta",
      vendor: "New India Assurance",
      issueDate: new Date("2025-10-02T00:00:00Z"),
      expiryDate: new Date("2027-10-02T00:00:00Z"),
      priority: Priority.MEDIUM,
      documentNumber: "PII-2025-8834",
    },
    {
      name: "Factory License – Unit 3",
      category: "Licenses",
      department: "Compliance",
      owner: "Ravi Verma",
      vendor: "State Labor Dept.",
      issueDate: new Date("2022-06-15T00:00:00Z"),
      expiryDate: new Date("2026-06-28T00:00:00Z"),
      priority: Priority.HIGH,
      documentNumber: "FL-2022-1123",
    },
    {
      name: "Vendor Supply Agreement – ABC Corp",
      category: "Contracts",
      department: "Procurement",
      owner: "Sneha Joshi",
      vendor: "ABC Corp Pvt Ltd",
      issueDate: new Date("2024-07-04T00:00:00Z"),
      expiryDate: new Date("2026-07-04T00:00:00Z"),
      priority: Priority.HIGH,
      documentNumber: "VSA-2024-0712",
    },
    {
      name: "Product Liability Insurance",
      category: "Insurance",
      department: "Finance",
      owner: "Karan Shah",
      vendor: "Bajaj Allianz",
      issueDate: new Date("2025-12-05T00:00:00Z"),
      expiryDate: new Date("2027-06-05T00:00:00Z"),
      priority: Priority.LOW,
      documentNumber: "PLI-2025-9901",
    },
    {
      name: "Crane Calibration Certificate",
      category: "Machine Inspection",
      department: "Engineering",
      owner: "Dinesh Tiwari",
      vendor: "TUV India",
      issueDate: new Date("2026-01-07T00:00:00Z"),
      expiryDate: new Date("2026-07-27T00:00:00Z"),
      priority: Priority.MEDIUM,
      documentNumber: "CCC-2026-0044",
    },
    {
      name: "Safety Officer Training Record",
      category: "Safety",
      department: "HSE",
      owner: "Meena Pillai",
      vendor: "NSCI Mumbai",
      issueDate: new Date("2024-03-10T00:00:00Z"),
      expiryDate: new Date("2026-06-10T00:00:00Z"),
      priority: Priority.HIGH,
      documentNumber: "SOT-2024-3301",
    },
  ];

  const adminUser = users["Rohan Mehta"];

  const seededRecords: Record<string, any> = {};
  for (const r of recordsData) {
    const ownerUser = users[r.owner] || adminUser;
    seededRecords[r.name] = await prisma.record.create({
      data: {
        name: r.name,
        description: `This is a tracking record for ${r.name}`,
        categoryId: categories[r.category].id,
        ownerId: ownerUser.id,
        departmentId: depts[r.department].id,
        vendor: r.vendor,
        documentNumber: r.documentNumber,
        issueDate: r.issueDate,
        expiryDate: r.expiryDate,
        priority: r.priority,
        createdById: adminUser.id,
      },
    });
  }

  // Create Mock Notifications for Rohan Mehta
  const notificationData = [
    {
      title: "Vendor Supply Agreement – ABC Corp expires in 2 days",
      message: "Action required. Please initiate the renewal process with ABC Corp Pvt Ltd.",
      severity: Severity.CRITICAL,
      read: false,
    },
    {
      title: "Annual Fire Safety Certificate expires in 3 days",
      message: "Please schedule an inspection with Fire Safety India Ltd.",
      severity: Severity.CRITICAL,
      read: false,
    },
    {
      title: "Boiler Inspection Certificate expires in 12 days",
      message: "Schedule verification with Bureau of Indian Standards.",
      severity: Severity.WARNING,
      read: false,
    },
    {
      title: "Factory License – Unit 3 has expired",
      message: "Safety warning. Operating license has expired. Contact State Labor Dept.",
      severity: Severity.DANGER,
      read: true,
    },
    {
      title: "Port Operating License requires renewal in 18 days",
      message: "Prepare documentation for Ministry of Ports.",
      severity: Severity.WARNING,
      read: true,
    },
    {
      title: "ISO 9001:2015 Certification renewal reminder set",
      message: "Routine notification. Reminder is set for Bureau Veritas.",
      severity: Severity.INFO,
      read: true,
    },
  ];

  for (const notif of notificationData) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: notif.title,
        message: notif.message,
        severity: notif.severity,
        read: notif.read,
      },
    });
  }

  // Create Mock Activity Logs
  const activityData = [
    {
      action: "Renewed",
      recordName: "GST Compliance Certificate",
      userName: "Priya Sharma",
      details: "Renewed record validity until 2027.",
    },
    {
      action: "Added",
      recordName: "New Vendor Contract – XYZ Ltd",
      userName: "Sneha Joshi",
      details: "Created new agreement record.",
    },
    {
      action: "Updated",
      recordName: "Boiler Inspection Certificate",
      userName: "Amit Patel",
      details: "Modified owner assignment and description.",
    },
    {
      action: "Deleted",
      recordName: "Expired Safety Audit 2023",
      userName: "Rajesh Kumar",
      details: "Archived expired audit file.",
    },
    {
      action: "Exported",
      recordName: "Q2 Compliance Report",
      userName: "Sunita Rao",
      details: "Generated custom PDF compliance report.",
    },
  ];

  for (const act of activityData) {
    const actUser = users[act.userName] || adminUser;
    await prisma.activityLog.create({
      data: {
        action: act.action,
        recordName: act.recordName,
        userId: actUser.id,
        userName: act.userName,
        details: act.details,
      },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

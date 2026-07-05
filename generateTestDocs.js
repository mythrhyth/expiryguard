const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function createPDF(filename, title, contentText) {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, filename);
  doc.pipe(fs.createWriteStream(filePath));
  
  // Custom brand colors
  doc.fillColor("#2563EB").fontSize(22).text(title, { align: "center" });
  doc.moveDown(1.5);
  
  doc.fillColor("#475569").fontSize(12).text(contentText, {
    align: "justify",
    lineGap: 4
  });
  
  doc.moveDown(2);
  doc.fontSize(10).fillColor("#94A3B8").text("Generated for ExpiryGuard Document Intelligence Test System.", {
    align: "center"
  });
  
  doc.end();
  console.log(`Created PDF: ${filePath}`);
}

// Generate the three mock-matching files and one generic unrecognized file
createPDF(
  "fire_safety_certificate.pdf",
  "Annual Fire Safety Certificate",
  "This document certifies that the plant operations of Tata Steel Ltd have undergone full fire safety audits. All fire suppression units, safety alarms, and ventilation bounds comply with regional standards.\n\nIssuer: Fire Safety India Ltd\nIssue Date: 2024-07-03\nExpiry Date: 2026-07-05\nPriority: HIGH\nDocument Number: FSC-2024-0891\nDepartment: Operations"
);

createPDF(
  "cyber_insurance.pdf",
  "Cyber Liability Insurance Policy",
  "This insurance policy covers cyber risk liability, network security breaches, and data privacy events for Tata Steel Ltd plant infrastructure.\n\nIssuer: HDFC Ergo Insurance\nIssue Date: 2025-07-02\nExpiry Date: 2026-07-07\nPriority: HIGH\nDocument Number: CLI-2025-4521\nDepartment: IT Security"
);

createPDF(
  "environmental_permit.pdf",
  "Environmental Compliance Permit",
  "Environmental discharge permit issued for industrial air emissions and water filtration compliance boundaries.\n\nIssuer: Ministry of Environment\nIssue Date: 2025-05-20\nExpiry Date: 2026-08-16\nPriority: MEDIUM\nDocument Number: ECP-2025-3421\nDepartment: Legal"
);

createPDF(
  "unrecognized_document.pdf",
  "General Vendor Agreement",
  "Standard service-level procurement contract for machinery maintenance and raw supply lines.\n\nIssuer: Unknown Corporate Issuer\nIssue Date: 2026-01-10\nExpiry Date: 2027-01-10\nPriority: MEDIUM\nDocument Number: CN-8124\nDepartment: Procurement"
);

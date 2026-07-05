import cron from "node-cron";
import { prisma } from "../prisma/client";
import { calculateRecordStatus } from "../utils/statusCalculator";
import { Severity } from "../types/enums";
import { logger } from "../utils/logger";

export const scanAndGenerateNotifications = async () => {
  logger.info("Starting automated record expiry scan...");
  try {
    const records = await prisma.record.findMany({
      include: {
        owner: true,
      },
    });

    let count = 0;
    for (const record of records) {
      const { daysLeft } = calculateRecordStatus(record.expiryDate);
      
      let alert = false;
      let title = "";
      let message = "";
      let severity: Severity = Severity.INFO;

      if (daysLeft === 30) {
        alert = true;
        title = `Warning: ${record.name} expires in 30 days`;
        message = `The record ${record.name} is approaching its expiry date (${record.expiryDate.toISOString().split("T")[0]}). Please prepare the renewal.`;
        severity = Severity.WARNING;
      } else if (daysLeft === 14) {
        alert = true;
        title = `Warning: ${record.name} expires in 14 days`;
        message = `The record ${record.name} will expire in 14 days. Ensure documentation is prepared.`;
        severity = Severity.WARNING;
      } else if (daysLeft === 7) {
        alert = true;
        title = `Critical: ${record.name} expires in 7 days`;
        message = `CRITICAL reminder: ${record.name} expires in 1 week. Action required immediately.`;
        severity = Severity.CRITICAL;
      } else if (daysLeft === 3) {
        alert = true;
        title = `Critical: ${record.name} expires in 3 days`;
        message = `CRITICAL alert: ${record.name} expires in 3 days. Renew immediately.`;
        severity = Severity.CRITICAL;
      } else if (daysLeft === 1) {
        alert = true;
        title = `Critical: ${record.name} expires tomorrow`;
        message = `Tomorrow is the expiry date for ${record.name}. Immediate renewal requested.`;
        severity = Severity.CRITICAL;
      } else if (daysLeft === 0) {
        alert = true;
        title = `Danger: ${record.name} has expired today`;
        message = `The record ${record.name} has expired. It is now out of compliance.`;
        severity = Severity.DANGER;
      }

      if (alert) {
        // Prevent duplicate notifications in the same day
        const existing = await prisma.notification.findFirst({
          where: {
            userId: record.ownerId,
            title,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: record.ownerId,
              title,
              message,
              severity,
            },
          });
          count++;
        }
      }
    }

    logger.info(`Record expiry scan completed. Generated ${count} new alerts.`);
  } catch (error) {
    logger.error("Error during record expiry notification scan: ", error);
  }
};

// Schedule job to run every night at 00:00 AM
export const initNotificationsCron = () => {
  cron.schedule("0 0 * * *", async () => {
    await scanAndGenerateNotifications();
  });
  logger.info("Record Expiry Scanner Cron Job initialized.");
};

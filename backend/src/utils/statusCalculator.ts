export interface RecordStatusInfo {
  daysLeft: number;
  status: "Active" | "Expiring" | "Critical" | "Expired";
}

export const calculateRecordStatus = (expiryDate: Date): RecordStatusInfo => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setUTCHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let status: "Active" | "Expiring" | "Critical" | "Expired";
  if (daysLeft < 0) {
    status = "Expired";
  } else if (daysLeft <= 7) {
    status = "Critical";
  } else if (daysLeft <= 30) {
    status = "Expiring";
  } else {
    status = "Active";
  }

  return { daysLeft, status };
};

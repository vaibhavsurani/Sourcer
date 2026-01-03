"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getMyTimeOffRequests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Get user's time off requests
    const timeOffs = await db.timeOff.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate used days by type
    const approvedTimeOffs = await db.timeOff.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
      },
    });

    const usedPaidDays = approvedTimeOffs
      .filter((t) => t.timeOffType === "PAID_TIME_OFF")
      .reduce((sum, t) => sum + t.days, 0);
    const usedSickDays = approvedTimeOffs
      .filter((t) => t.timeOffType === "SICK_LEAVE")
      .reduce((sum, t) => sum + t.days, 0);

    // Standard allocations
    const totalPaidDays = 24;
    const totalSickDays = 7;

    // Format time off requests
    const timeOffRequests = timeOffs.map((timeOff) => ({
      id: timeOff.id,
      startDate: timeOff.startDate.toISOString().split("T")[0],
      endDate: timeOff.endDate.toISOString().split("T")[0],
      timeOffType: timeOff.timeOffType,
      days: timeOff.days,
      status: timeOff.status,
      attachment: timeOff.attachment,
      notes: timeOff.notes,
      rejectionReason: timeOff.rejectionReason,
      createdAt: timeOff.createdAt,
    }));

    return {
      timeOffRequests,
      allocations: {
        paidTimeOff: {
          total: totalPaidDays,
          used: usedPaidDays,
          available: totalPaidDays - usedPaidDays,
        },
        sickTimeOff: {
          total: totalSickDays,
          used: usedSickDays,
          available: totalSickDays - usedSickDays,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching time off requests:", error);
    return { error: "Failed to fetch time off requests" };
  }
}


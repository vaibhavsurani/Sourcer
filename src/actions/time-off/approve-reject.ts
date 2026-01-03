"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function approveTimeOffRequest(timeOffId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "HR") {
      return { error: "Only HR can approve time off requests" };
    }

    const timeOff = await db.timeOff.findUnique({
      where: { id: timeOffId },
      include: { user: true },
    });

    if (!timeOff) {
      return { error: "Time off request not found" };
    }

    // Verify the employee belongs to this HR
    if (timeOff.user.hrId !== user.id) {
      return { error: "Unauthorized to approve this request" };
    }

    await db.timeOff.update({
      where: { id: timeOffId },
      data: {
        status: "APPROVED",
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    });

    return { success: "Time off request approved" };
  } catch (error) {
    console.error("Error approving time off request:", error);
    return { error: "Failed to approve time off request" };
  }
}

export async function rejectTimeOffRequest(
  timeOffId: string,
  reason?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "HR") {
      return { error: "Only HR can reject time off requests" };
    }

    const timeOff = await db.timeOff.findUnique({
      where: { id: timeOffId },
      include: { user: true },
    });

    if (!timeOff) {
      return { error: "Time off request not found" };
    }

    // Verify the employee belongs to this HR
    if (timeOff.user.hrId !== user.id) {
      return { error: "Unauthorized to reject this request" };
    }

    await db.timeOff.update({
      where: { id: timeOffId },
      data: {
        status: "REJECTED",
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectionReason: reason || null,
      },
    });

    return { success: "Time off request rejected" };
  } catch (error) {
    console.error("Error rejecting time off request:", error);
    return { error: "Failed to reject time off request" };
  }
}


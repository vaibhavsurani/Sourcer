"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function createTimeOffRequest(data: {
  userId?: string;
  timeOffType: string;
  startDate: string;
  endDate: string;
  attachment?: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Determine user ID (HR can create for employees, employees create for themselves)
    const targetUserId = data.userId || user.id;

    // If HR is creating for an employee, verify the employee belongs to them
    if (user.role === "HR" && data.userId) {
      const employee = await db.user.findUnique({
        where: { id: data.userId },
      });
      if (!employee || employee.hrId !== user.id) {
        return { error: "Employee not found or doesn't belong to you" };
      }
    }

    // Calculate days between start and end date
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

    // Create time off request
    const timeOff = await db.timeOff.create({
      data: {
        userId: targetUserId,
        timeOffType: data.timeOffType as any,
        startDate: start,
        endDate: end,
        days: diffDays,
        attachment: data.attachment || null,
        notes: data.notes || null,
        status: "PENDING",
      },
    });

    return { success: "Time off request created successfully", timeOff };
  } catch (error) {
    console.error("Error creating time off request:", error);
    return { error: "Failed to create time off request" };
  }
}


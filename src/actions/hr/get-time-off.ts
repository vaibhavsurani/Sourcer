"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getTimeOffRequests(searchQuery?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Get HR user
    const hrUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!hrUser || hrUser.role !== "HR") {
      return { error: "Only HR can view time off requests" };
    }

    // Get all employees under this HR
    const employees = await db.user.findMany({
      where: {
        hrId: hrUser.id,
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        timeOffs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Get time off allocations
    const allocations = await db.timeOff.groupBy({
      by: ["userId", "timeOffType", "status"],
      where: {
        userId: {
          in: employees.map((e) => e.id),
        },
        status: "APPROVED",
      },
      _sum: {
        days: true,
      },
    });

    // Calculate available days for each employee
    const employeeAllocations: Record<string, { paid: number; sick: number }> = {};
    
    employees.forEach((emp) => {
      employeeAllocations[emp.id] = { paid: 0, sick: 0 };
    });

    allocations.forEach((alloc) => {
      if (!employeeAllocations[alloc.userId]) {
        employeeAllocations[alloc.userId] = { paid: 0, sick: 0 };
      }
      if (alloc.timeOffType === "PAID_TIME_OFF") {
        employeeAllocations[alloc.userId].paid += alloc._sum.days || 0;
      } else if (alloc.timeOffType === "SICK_LEAVE") {
        employeeAllocations[alloc.userId].sick += alloc._sum.days || 0;
      }
    });

    // Format time off requests
    let timeOffRequests = employees.flatMap((employee) =>
      employee.timeOffs.map((timeOff) => ({
        id: timeOff.id,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        employeeIdCode: employee.employeeId,
        startDate: timeOff.startDate.toISOString().split("T")[0],
        endDate: timeOff.endDate.toISOString().split("T")[0],
        timeOffType: timeOff.timeOffType,
        days: timeOff.days,
        status: timeOff.status,
        attachment: timeOff.attachment,
        notes: timeOff.notes,
        createdAt: timeOff.createdAt,
      }))
    );

    // Filter by search query if provided
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      timeOffRequests = timeOffRequests.filter(
        (req) =>
          req.employeeName.toLowerCase().includes(query) ||
          req.employeeEmail.toLowerCase().includes(query) ||
          req.employeeIdCode?.toLowerCase().includes(query)
      );
    }

    // Sort by creation date (newest first)
    timeOffRequests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate total allocations (assuming standard allocations)
    const totalPaidDays = 24; // Standard allocation
    const totalSickDays = 7; // Standard allocation

    // Calculate used days
    const usedPaidDays = allocations
      .filter((a) => a.timeOffType === "PAID_TIME_OFF")
      .reduce((sum, a) => sum + (a._sum.days || 0), 0);
    const usedSickDays = allocations
      .filter((a) => a.timeOffType === "SICK_LEAVE")
      .reduce((sum, a) => sum + (a._sum.days || 0), 0);

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


"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getMyAttendance(month: number, year: number) {
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

    // Get start and end of the selected month
    const startOfMonth = new Date(year, month, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get all attendance records for this month
    const attendances = await db.attendance.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate summary statistics
    const daysPresent = attendances.filter(
      (a) => a.status === "PRESENT" || a.status === "HALF_DAY"
    ).length;
    const leavesCount = attendances.filter((a) => a.status === "LEAVE").length;
    const totalWorkingDays = attendances.length;

    // Format the data
    const attendanceData = attendances.map((attendance) => {
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workHours: string | null = null;
      let extraHours: string | null = null;

      if (attendance.checkIn) {
        const checkInDate = new Date(attendance.checkIn);
        checkIn = checkInDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      if (attendance.checkOut) {
        const checkOutDate = new Date(attendance.checkOut);
        checkOut = checkOutDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      if (attendance.workHours !== null) {
        const hours = Math.floor(attendance.workHours);
        const minutes = Math.floor((attendance.workHours - hours) * 60);
        workHours = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }
      if (attendance.extraHours !== null) {
        const hours = Math.floor(attendance.extraHours);
        const minutes = Math.floor((attendance.extraHours - hours) * 60);
        extraHours = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }

      // Format date as DD/MM/YYYY
      const date = new Date(attendance.date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      return {
        id: attendance.id,
        date: formattedDate,
        checkIn,
        checkOut,
        workHours,
        extraHours,
        status: attendance.status,
      };
    });

    return {
      attendanceData,
      summary: {
        daysPresent,
        leavesCount,
        totalWorkingDays,
      },
    };
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return { error: "Failed to fetch attendance" };
  }
}


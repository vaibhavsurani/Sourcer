"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getAttendanceByDate(date: Date, searchQuery?: string) {
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
      return { error: "Only HR can view attendance" };
    }

    // Get start of the selected date (for date comparison)
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all employees under this HR
    const whereClause: any = {
      hrId: hrUser.id,
      role: "EMPLOYEE",
    };

    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.trim();
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { employeeId: { contains: query, mode: "insensitive" } },
      ];
    }

    const employees = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        image: true,
        attendances: {
          where: {
            date: {
              gte: selectedDateOnly,
              lt: nextDay,
            },
          },
          take: 1,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Format the data
    const attendanceData = employees.map((employee) => {
      const attendance = employee.attendances[0];
      
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workHours: string | null = null;
      let extraHours: string | null = null;

      if (attendance) {
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
      }

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        image: employee.image,
        checkIn,
        checkOut,
        workHours,
        extraHours,
        status: attendance?.status || "ABSENT",
      };
    });

    return { attendanceData, date };
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return { error: "Failed to fetch attendance" };
  }
}


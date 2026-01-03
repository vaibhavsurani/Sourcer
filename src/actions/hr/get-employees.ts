"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getEmployees() {
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
      return { error: "Only HR can view employees" };
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
        image: true,
        employeeId: true,
        jobPosition: true,
        department: true,
        phoneNumber: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { employees };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return { error: "Failed to fetch employees" };
  }
}


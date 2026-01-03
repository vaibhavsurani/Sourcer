"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMyAttendance } from "@/actions/employee/get-my-attendance";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttendanceRecord = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string | null;
  extraHours: string | null;
  status: string;
};

type Summary = {
  daysPresent: number;
  leavesCount: number;
  totalWorkingDays: number;
};

export default function EmployeeAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({
    daysPresent: 0,
    leavesCount: 0,
    totalWorkingDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAttendance();
  }, [selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    setIsLoading(true);
    const result = await getMyAttendance(selectedMonth, selectedYear);
    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }
    if (result.attendanceData && result.summary) {
      setAttendanceData(result.attendanceData);
      setSummary(result.summary);
    }
    setIsLoading(false);
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const formatMonthYear = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatDateDisplay = (month: number, year: number) => {
    const date = new Date(year, month, 22); // Using 22 as shown in reference
    const day = date.getDate();
    const monthName = date.toLocaleDateString("en-US", { month: "long" });
    return `${day}, ${monthName} ${year}`;
  };


  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-[#CFCBC8]">Attendance</h1>

        {/* Date Navigation and Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMonthChange("prev")}
              className="border-[#CFCBC8]/20 text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-black/40 border border-[#CFCBC8]/20 text-[#CFCBC8] rounded-md px-3 py-2 focus:outline-none focus:border-[#CFCBC8]/50"
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-black/40 border border-[#CFCBC8]/20 text-[#CFCBC8] rounded-md px-3 py-2 focus:outline-none focus:border-[#CFCBC8]/50"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMonthChange("next")}
              className="border-[#CFCBC8]/20 text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Summary Statistics */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-lg px-4 py-3 min-w-[180px]">
              <div className="text-xs text-[#CFCBC8]/60 mb-1">
                Count of days present
              </div>
              <div className="text-lg font-semibold text-[#CFCBC8]">
                {summary.daysPresent}
              </div>
            </div>
            <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-lg px-4 py-3 min-w-[180px]">
              <div className="text-xs text-[#CFCBC8]/60 mb-1">Leaves count</div>
              <div className="text-lg font-semibold text-[#CFCBC8]">
                {summary.leavesCount}
              </div>
            </div>
            <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-lg px-4 py-3 min-w-[180px]">
              <div className="text-xs text-[#CFCBC8]/60 mb-1">
                Total working days
              </div>
              <div className="text-lg font-semibold text-[#CFCBC8]">
                {summary.totalWorkingDays}
              </div>
            </div>
          </div>
        </div>

        {/* Date Display */}
        <div className="text-lg font-semibold text-[#CFCBC8]">
          {formatDateDisplay(selectedMonth, selectedYear)}
        </div>

        {/* Attendance Table */}
        <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFCBC8]/10 hover:bg-[#CFCBC8]/5">
                <TableHead className="text-[#CFCBC8] font-semibold">Date</TableHead>
                <TableHead className="text-[#CFCBC8] font-semibold">Check In</TableHead>
                <TableHead className="text-[#CFCBC8] font-semibold">Check Out</TableHead>
                <TableHead className="text-[#CFCBC8] font-semibold">Work Hours</TableHead>
                <TableHead className="text-[#CFCBC8] font-semibold">Extra hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#CFCBC8]/60">
                    No attendance records found for this month
                  </TableCell>
                </TableRow>
              ) : (
                attendanceData.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-[#CFCBC8]/10 hover:bg-[#CFCBC8]/5"
                  >
                    <TableCell className="text-[#CFCBC8]">{record.date}</TableCell>
                    <TableCell className="text-[#CFCBC8]">
                      {record.checkIn || "-"}
                    </TableCell>
                    <TableCell className="text-[#CFCBC8]">
                      {record.checkOut || "-"}
                    </TableCell>
                    <TableCell className="text-[#CFCBC8]">
                      {record.workHours || "-"}
                    </TableCell>
                    <TableCell className="text-[#CFCBC8]">
                      {record.extraHours || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getAttendanceByDate } from "@/actions/hr/get-attendance";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttendanceData = {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  image: string | null;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string | null;
  extraHours: string | null;
  status: string;
};

export default function HrAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setIsLoading(true);
    const result = await getAttendanceByDate(selectedDate, searchQuery);
    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }
    if (result.attendanceData) {
      setAttendanceData(result.attendanceData);
    }
    setIsLoading(false);
  };

  const handleSearch = () => {
    loadAttendance();
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6">
        {/* Header with Search and Date Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-[#CFCBC8]">Attendance</h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCBC8]/50" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="pl-10 bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8] placeholder:text-[#CFCBC8]/40 focus:border-[#CFCBC8]/50"
              />
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange(-1)}
                className="border-[#CFCBC8]/20 text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="relative">
                <Input
                  type="date"
                  value={formatDateForInput(selectedDate)}
                  onChange={handleDateInputChange}
                  className="w-[140px] bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8]"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCBC8]/50 pointer-events-none" />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange(1)}
                className="border-[#CFCBC8]/20 text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
                className="border-[#CFCBC8]/20 text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
              >
                Day
              </Button>
            </div>
          </div>
        </div>

        {/* Date Display */}
        <div className="text-lg font-semibold text-[#CFCBC8]">
          {formatDate(selectedDate)}
        </div>

        {/* Attendance Table */}
        <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFCBC8]/10 hover:bg-[#CFCBC8]/5">
                <TableHead className="text-[#CFCBC8] font-semibold">Emp</TableHead>
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
                    No attendance records found for this date
                  </TableCell>
                </TableRow>
              ) : (
                attendanceData.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-[#CFCBC8]/10 hover:bg-[#CFCBC8]/5"
                  >
                    <TableCell className="text-[#CFCBC8]">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record.image ?? ""} />
                          <AvatarFallback className="bg-[#CFCBC8]/10 text-[#CFCBC8] text-sm">
                            {record.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{record.name}</div>
                          {record.employeeId && (
                            <div className="text-xs text-[#CFCBC8]/50">
                              {record.employeeId}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
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


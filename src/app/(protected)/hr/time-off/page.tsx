"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Check, X } from "lucide-react";
import { getTimeOffRequests } from "@/actions/hr/get-time-off";
import { approveTimeOffRequest, rejectTimeOffRequest } from "@/actions/time-off/approve-reject";
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
import { TimeOffRequestModal } from "@/components/time-off/TimeOffRequestModal";
import { getEmployees } from "@/actions/hr/get-employees";

type TimeOffRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeIdCode?: string | null;
  startDate: string;
  endDate: string;
  timeOffType: string;
  days: number;
  status: string;
  attachment: string | null;
  notes: string | null;
  createdAt: Date;
};

export default function HrTimeOffPage() {
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [allocations, setAllocations] = useState({
    paidTimeOff: { total: 24, used: 0, available: 24 },
    sickTimeOff: { total: 7, used: 0, available: 7 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"timeoff" | "allocation">("timeoff");

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    const [timeOffResult, employeesResult] = await Promise.all([
      getTimeOffRequests(searchQuery),
      getEmployees(),
    ]);

    if (timeOffResult.error) {
      toast.error(timeOffResult.error);
    } else if (timeOffResult.timeOffRequests) {
      setTimeOffRequests(timeOffResult.timeOffRequests);
      if (timeOffResult.allocations) {
        setAllocations(timeOffResult.allocations);
      }
    }

    if (employeesResult.employees) {
      setEmployees(employeesResult.employees);
    }

    setIsLoading(false);
  };

  const handleApprove = async (id: string) => {
    const result = await approveTimeOffRequest(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      loadData();
    }
  };

  const handleReject = async (id: string) => {
    const result = await rejectTimeOffRequest(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      loadData();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTimeOffTypeLabel = (type: string) => {
    switch (type) {
      case "PAID_TIME_OFF":
        return "Paid time Off";
      case "SICK_LEAVE":
        return "Sick Leave";
      case "UNPAID_LEAVE":
        return "Unpaid Leaves";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-500";
      case "REJECTED":
        return "text-red-500";
      case "PENDING":
        return "text-yellow-500";
      default:
        return "text-[#CFCBC8]";
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6">
        {/* Sub-navigation */}
        <div className="flex gap-2 border-b border-[#CFCBC8]/10">
          <button
            onClick={() => setActiveTab("timeoff")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "timeoff"
                ? "border-b-2 border-[#CFCBC8] text-[#CFCBC8]"
                : "text-[#CFCBC8]/60 hover:text-[#CFCBC8]"
            }`}
          >
            Time Off
          </button>
          <button
            onClick={() => setActiveTab("allocation")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "allocation"
                ? "border-b-2 border-[#CFCBC8] text-[#CFCBC8]"
                : "text-[#CFCBC8]/60 hover:text-[#CFCBC8]"
            }`}
          >
            Allocation
          </button>
        </div>

        {activeTab === "timeoff" && (
          <>
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Button
                onClick={() => setShowModal(true)}
                className="bg-[#CFCBC8] text-black border border-[#CFCBC8] hover:bg-[#EAE8E6] shadow-[0_0_10px_-2px_rgba(207,203,200,0.3)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW
              </Button>

              <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCBC8]/50" />
                <Input
                  type="text"
                  placeholder="Searchbar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadData();
                    }
                  }}
                  className="pl-10 bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8] placeholder:text-[#CFCBC8]/40 focus:border-[#CFCBC8]/50"
                />
              </div>
            </div>

            {/* Summary Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-lg px-4 py-3">
                <div className="text-sm text-[#CFCBC8]/60 mb-1">Paid time Off</div>
                <div className="text-lg font-semibold text-[#CFCBC8]">
                  {allocations.paidTimeOff.available} Days Available
                </div>
              </div>
              <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-lg px-4 py-3">
                <div className="text-sm text-[#CFCBC8]/60 mb-1">Sick time off</div>
                <div className="text-lg font-semibold text-[#CFCBC8]">
                  {allocations.sickTimeOff.available} Days Available
                </div>
              </div>
            </div>

            {/* Time Off Requests Table */}
            <div className="bg-black/40 border border-[#CFCBC8]/10 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#CFCBC8]/10 hover:bg-[#CFCBC8]/5">
                    <TableHead className="text-[#CFCBC8] font-semibold">Name</TableHead>
                    <TableHead className="text-[#CFCBC8] font-semibold">Start Date</TableHead>
                    <TableHead className="text-[#CFCBC8] font-semibold">End Date</TableHead>
                    <TableHead className="text-[#CFCBC8] font-semibold">Time off Type</TableHead>
                    <TableHead className="text-[#CFCBC8] font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeOffRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-[#CFCBC8]/60">
                        No time off requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeOffRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className="border-[#CFCBC8]/10 hover:bg-[#CFCBC8]/5"
                      >
                        <TableCell className="text-[#CFCBC8]">
                          {request.employeeName}
                        </TableCell>
                        <TableCell className="text-[#CFCBC8]">
                          {formatDate(request.startDate)}
                        </TableCell>
                        <TableCell className="text-[#CFCBC8]">
                          {formatDate(request.endDate)}
                        </TableCell>
                        <TableCell className="text-[#CFCBC8]">
                          {getTimeOffTypeLabel(request.timeOffType)}
                        </TableCell>
                        <TableCell className="text-[#CFCBC8]">
                          <div className="flex items-center gap-2">
                            <span className={getStatusColor(request.status)}>
                              {request.status}
                            </span>
                            {request.status === "PENDING" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(request.id)}
                                  className="h-6 px-2 border-green-500/50 text-green-400 hover:bg-green-950/30"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(request.id)}
                                  className="h-6 px-2 border-red-500/50 text-red-400 hover:bg-red-950/30"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {activeTab === "allocation" && (
          <div className="text-center py-12 text-[#CFCBC8]/60">
            Allocation view coming soon
          </div>
        )}
      </div>

      {/* Time Off Request Modal */}
      {showModal && (
        <TimeOffRequestModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            loadData();
          }}
          employees={employees}
          isHR={true}
        />
      )}
    </div>
  );
}


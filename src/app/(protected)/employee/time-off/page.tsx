"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getMyTimeOffRequests } from "@/actions/employee/get-my-time-off";
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

type TimeOffRequest = {
  id: string;
  startDate: string;
  endDate: string;
  timeOffType: string;
  days: number;
  status: string;
  attachment: string | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: Date;
};

export default function EmployeeTimeOffPage() {
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [allocations, setAllocations] = useState({
    paidTimeOff: { total: 24, used: 0, available: 24 },
    sickTimeOff: { total: 7, used: 0, available: 7 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const result = await getMyTimeOffRequests();
    if (result.error) {
      toast.error(result.error);
    } else if (result.timeOffRequests) {
      setTimeOffRequests(result.timeOffRequests);
      if (result.allocations) {
        setAllocations(result.allocations);
      }
    }
    setIsLoading(false);
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#CFCBC8]">Time Off</h1>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#CFCBC8] text-black border border-[#CFCBC8] hover:bg-[#EAE8E6] shadow-[0_0_10px_-2px_rgba(207,203,200,0.3)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            NEW
          </Button>
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
                      My Request
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
                      <span className={getStatusColor(request.status)}>
                        {request.status}
                      </span>
                      {request.rejectionReason && (
                        <div className="text-xs text-red-400 mt-1">
                          {request.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Time Off Request Modal */}
      {showModal && (
        <TimeOffRequestModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            loadData();
          }}
          employees={[]}
          isHR={false}
        />
      )}
    </div>
  );
}


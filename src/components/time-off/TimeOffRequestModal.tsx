"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTimeOffRequest } from "@/actions/time-off/create-time-off";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { useCurrentUserClient } from "@/hook/use-current-user";

type Employee = {
  id: string;
  name: string;
  email: string;
};

interface TimeOffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  isHR: boolean;
}

export function TimeOffRequestModal({
  isOpen,
  onClose,
  employees,
  isHR,
}: TimeOffRequestModalProps) {
  const { user } = useCurrentUserClient();
  const [isPending, startTransition] = useTransition();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [timeOffType, setTimeOffType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");

  const calculateDays = () => {
    if (!startDate || !endDate) return "0.00";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return "0.00";
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays.toFixed(2);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    return `${startMonth} ${start.getDate()} To ${endMonth} ${end.getDate()}`;
  };

  const handleSubmit = () => {
    if (!timeOffType || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isHR && !selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    startTransition(() => {
      createTimeOffRequest({
        userId: isHR ? selectedEmployee : undefined,
        timeOffType,
        startDate,
        endDate,
        attachment: attachment ? attachment.name : undefined,
        notes: notes || undefined,
      })
        .then((result) => {
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success(result.success);
            handleClose();
          }
        })
        .catch(() => {
          toast.error("Failed to create time off request");
        });
    });
  };

  const handleClose = () => {
    setSelectedEmployee("");
    setTimeOffType("");
    setStartDate("");
    setEndDate("");
    setAttachment(null);
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-[#CFCBC8]/20 text-[#CFCBC8] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#CFCBC8]">
            Time off Type Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Selection (HR only) */}
          {isHR && (
            <div>
              <Label className="text-[#CFCBC8]">Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
                disabled={isPending}
              >
                <SelectTrigger className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8]">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-black border-[#CFCBC8]/20">
                  {employees.map((emp) => (
                    <SelectItem
                      key={emp.id}
                      value={emp.id}
                      className="text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
                    >
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time Off Type */}
          <div>
            <Label className="text-[#CFCBC8]">Time off Type</Label>
            <Select
              value={timeOffType}
              onValueChange={setTimeOffType}
              disabled={isPending}
            >
              <SelectTrigger className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8]">
                <SelectValue placeholder="Select time off type" />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#CFCBC8]/20">
                <SelectItem
                  value="PAID_TIME_OFF"
                  className="text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
                >
                  Paid Time off
                </SelectItem>
                <SelectItem
                  value="SICK_LEAVE"
                  className="text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
                >
                  Sick Leave
                </SelectItem>
                <SelectItem
                  value="UNPAID_LEAVE"
                  className="text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
                >
                  Unpaid Leaves
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validity Period */}
          <div>
            <Label className="text-[#CFCBC8]">Validity Period</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
                className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8]"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending}
                min={startDate}
                className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8]"
              />
            </div>
            {startDate && endDate && (
              <p className="text-sm text-[#CFCBC8]/60 mt-1">
                {formatDateRange()}
              </p>
            )}
          </div>

          {/* Allocation */}
          <div>
            <Label className="text-[#CFCBC8]">Allocation</Label>
            <Input
              value={`${calculateDays()} Days`}
              disabled
              className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8] cursor-not-allowed"
            />
          </div>

          {/* Attachment */}
          <div>
            <Label className="text-[#CFCBC8]">Attachment</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                disabled={isPending}
                className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8]"
              />
              {attachment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setAttachment(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {timeOffType === "SICK_LEAVE" && (
              <p className="text-xs text-[#CFCBC8]/50 mt-1">
                (For sick leave certificate)
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-[#CFCBC8]">Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              placeholder="Add any additional notes..."
              className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8]"
            />
          </div>

          {/* Time Off Types Info */}
          <div className="bg-black/60 border border-[#CFCBC8]/10 rounded-lg p-3">
            <div className="text-sm font-semibold text-[#CFCBC8] mb-2">
              TimeOff Types:
            </div>
            <ul className="text-xs text-[#CFCBC8]/60 space-y-1">
              <li>- Paid Time off</li>
              <li>- Sick Leave</li>
              <li>- Unpaid Leaves</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="border-[#CFCBC8]/20 text-[#CFCBC8] hover:bg-[#CFCBC8]/10"
            >
              Discard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-[#CFCBC8] text-black hover:bg-[#EAE8E6]"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


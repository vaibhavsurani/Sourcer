"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Circle, Plane, Loader2, UserPlus } from "lucide-react";
import { getEmployees } from "@/actions/hr/get-employees";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { useTransition } from "react";
import { AddEmployee } from "@/actions/auth/add-employee";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeAddSchema } from "@/lib";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Employee = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  employeeId: string | null;
  jobPosition: string | null;
  department: string | null;
  phoneNumber: string | null;
  createdAt: Date;
};

type EmployeeStatus = "present" | "leave" | "absent";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.employeeId?.toLowerCase().includes(query) ||
          emp.jobPosition?.toLowerCase().includes(query) ||
          emp.department?.toLowerCase().includes(query)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  const loadEmployees = async () => {
    setIsLoading(true);
    const result = await getEmployees();
    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }
    if (result.employees) {
      setEmployees(result.employees);
      setFilteredEmployees(result.employees);
    }
    setIsLoading(false);
  };

  const handleEmployeeAdded = () => {
    setShowAddEmployee(false);
    loadEmployees();
  };

  // Mock status - in real app, this would come from attendance data
  const getEmployeeStatus = (employee: Employee): EmployeeStatus => {
    // For now, randomly assign status for demo purposes
    // In production, this would check attendance records
    const random = Math.random();
    if (random < 0.6) return "present";
    if (random < 0.8) return "leave";
    return "absent";
  };

  const renderStatusIcon = (status: EmployeeStatus) => {
    switch (status) {
      case "present":
        return (
          <div className="absolute top-3 right-3">
            <Circle className="w-5 h-5 text-green-500 fill-green-500" />
          </div>
        );
      case "leave":
        return (
          <div className="absolute top-3 right-3">
            <Plane className="w-5 h-5 text-blue-500" />
          </div>
        );
      case "absent":
        return (
          <div className="absolute top-3 right-3">
            <Circle className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
        );
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            onClick={() => setShowAddEmployee(!showAddEmployee)}
            className={`transition-all duration-300 ${
              showAddEmployee
                ? "bg-transparent border border-red-500/50 text-red-400 hover:bg-red-950/30"
                : "bg-[#CFCBC8] text-black border border-[#CFCBC8] hover:bg-[#EAE8E6] shadow-[0_0_10px_-2px_rgba(207,203,200,0.3)]"
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showAddEmployee ? "Cancel" : "NEW"}
          </Button>

          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCBC8]/50" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8] placeholder:text-[#CFCBC8]/40 focus:border-[#CFCBC8]/50"
            />
          </div>
        </div>

        {/* Add Employee Form */}
        {showAddEmployee && (
          <div className="bg-black/40 rounded-xl border border-[#CFCBC8]/10 p-6">
            <AddEmployeeFormWrapper onSuccess={handleEmployeeAdded} />
          </div>
        )}

        {/* Employee Cards Grid */}
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#CFCBC8]/10 rounded-xl bg-[#CFCBC8]/5">
            <p className="text-[#CFCBC8]/70 font-medium">
              {searchQuery ? "No employees found" : "No employees yet"}
            </p>
            <p className="text-sm text-[#CFCBC8]/40 mt-1">
              {searchQuery
                ? "Try adjusting your search query"
                : "Click the NEW button to add your first employee"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => {
              const status = getEmployeeStatus(employee);
              return (
                <div
                  key={employee.id}
                  className="relative bg-black/40 border border-[#CFCBC8]/10 rounded-xl p-6 hover:border-[#CFCBC8]/30 transition-all cursor-pointer group"
                  onClick={() => {
                    // Navigate to employee details page if needed
                    // router.push(`/hr/employees/${employee.id}`);
                  }}
                >
                  {/* Status Indicator */}
                  {renderStatusIcon(status)}

                  {/* Employee Card Content */}
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Profile Picture */}
                    <Avatar className="h-24 w-24 border-2 border-[#CFCBC8]/20">
                      <AvatarImage src={employee.image ?? ""} />
                      <AvatarFallback className="bg-[#CFCBC8]/10 text-[#CFCBC8] text-2xl font-bold">
                        {employee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Employee Name */}
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-[#CFCBC8]">
                        {employee.name}
                      </h3>
                      {employee.jobPosition && (
                        <p className="text-sm text-[#CFCBC8]/60">
                          {employee.jobPosition}
                        </p>
                      )}
                      {employee.department && (
                        <p className="text-xs text-[#CFCBC8]/40">
                          {employee.department}
                        </p>
                      )}
                      {employee.employeeId && (
                        <p className="text-xs text-[#CFCBC8]/50 font-mono mt-2">
                          ID: {employee.employeeId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component for AddEmployeeForm with callback
function AddEmployeeFormWrapper({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(EmployeeAddSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
    },
  });

  const onSubmit = (values: z.infer<typeof EmployeeAddSchema>) => {
    const toastId = toast.loading("Adding employee...");

    startTransition(() => {
      AddEmployee(values)
        .then(
          (data: { success?: string; error?: string; employeeId?: string }) => {
            if (data.error) {
              toast.error(data.error, {
                closeButton: true,
                id: toastId,
              });
            } else {
              toast.success(data.success, {
                closeButton: true,
                id: toastId,
              });
              form.reset();
              onSuccess();
            }
          }
        )
        .catch((error) => {
          toast.error("Something went wrong!", {
            closeButton: true,
            id: toastId,
          });
        });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-[#CFCBC8] mb-2">
          Add New Employee
        </h3>
        <p className="text-sm text-[#CFCBC8]/60">
          Create a new employee account. Credentials will be auto-generated and sent via email.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            disabled={isPending}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#CFCBC8]">Employee Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    disabled={isPending}
                    className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8] placeholder:text-[#CFCBC8]/40"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            disabled={isPending}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#CFCBC8]">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="employee@company.com"
                    {...field}
                    disabled={isPending}
                    type="email"
                    className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8] placeholder:text-[#CFCBC8]/40"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            disabled={isPending}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#CFCBC8]">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1234567890"
                    {...field}
                    disabled={isPending}
                    type="tel"
                    className="bg-black/40 border-[#CFCBC8]/20 text-[#CFCBC8] placeholder:text-[#CFCBC8]/40"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={isPending}
            type="submit"
            className="w-full bg-[#CFCBC8] text-black hover:bg-[#EAE8E6]"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Add Employee
          </Button>
        </form>
      </Form>
    </div>
  );
}

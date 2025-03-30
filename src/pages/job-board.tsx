import React, { useState, Fragment } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, getDaysInMonth } from "date-fns";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function JobBoard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewType, setViewType] = useState<"year" | "month">("year");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch projects from your API
  const { data: projectData = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Projects Timeline</h1>
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewType === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("year")}
              >
                Year
              </Button>
              <Button
                variant={viewType === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("month")}
              >
                Month
              </Button>
            </div>

            {viewType === "year" ? (
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder={currentYear.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={months[selectedMonth]} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder={currentYear.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <Link href="/projects/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Timeline Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewType === "year" ? "Yearly View" : "Monthly View"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {viewType === "year" ? (
                  /* ================= YEARLY VIEW ================= */
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "minmax(120px, auto) repeat(12, 1fr)",
                      gap: "0.2rem",
                    }}
                  >
                    {/* Header Row (Months) */}
                    <div className="border-b" />
                    {months.map((m) => (
                      <div
                        key={m}
                        className="text-xs font-medium text-center text-muted-foreground border-b"
                      >
                        {m}
                      </div>
                    ))}

                    {/* Project Rows */}
                    {projectData.map((project) => {
                      const start = new Date(project.startDate);
                      const end = new Date(project.endDate);

                      // Optional: set hours to avoid time-zone issues
                      start.setHours(0, 0, 0, 0);
                      end.setHours(23, 59, 59, 999);

                      const startYear = start.getFullYear();
                      const endYear = end.getFullYear();
                      const startMonth = start.getMonth();
                      const endMonth = end.getMonth();

                      return (
                        <Fragment key={project.id}>
                          {/* Project Name */}
                          <div className="text-xs font-medium truncate pr-2 border-b border-r">
                            {project.projectName}
                          </div>

                          {/* Month Cells (12) */}
                          {Array.from({ length: 12 }, (_, monthIndex) => {
                            const isInRange =
                              (selectedYear > startYear ||
                                (selectedYear === startYear &&
                                  monthIndex >= startMonth)) &&
                              (selectedYear < endYear ||
                                (selectedYear === endYear &&
                                  monthIndex <= endMonth));

                            return (
                              <div
                                key={monthIndex}
                                className="relative h-6 flex items-center justify-center border-b border-r"
                              >
                                {isInRange && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div
                                            className={`absolute inset-0 border-y ${
                                              project.status === "High Risk"
                                                ? "bg-red-500/20 border-red-500"
                                                : project.status === "Low Risk"
                                                ? "bg-green-500/20 border-green-500"
                                                : "bg-blue-500/20 border-blue-500"
                                            } ${
                                              selectedYear === startYear &&
                                              monthIndex === startMonth
                                                ? "border-l"
                                                : ""
                                            } ${
                                              selectedYear === endYear &&
                                              monthIndex === endMonth
                                                ? "border-r"
                                                : ""
                                            }`}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="space-y-1">
                                          <p className="font-medium">
                                            {project.projectName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {format(start, "dd MMM yyyy")} -{" "}
                                            {format(end, "dd MMM yyyy")}
                                          </p>
                                          <p className="text-xs">
                                            Status: {project.status}
                                          </p>
                                          <p className="text-xs">
                                            Category: {project.category}
                                          </p>
                                          <p className="text-xs">
                                            Team: {project.assignedTo}
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </div>
                ) : (
                  /* ================= MONTHLY VIEW ================= */
                  (() => {
                    const daysInMonth = getDaysInMonth(
                      new Date(selectedYear, selectedMonth)
                    );

                    return (
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `minmax(120px, auto) repeat(${daysInMonth}, minmax(20px, 1fr))`,
                          gap: "0.2rem",
                        }}
                      >
                        {/* Header Row (Days) */}
                        <div className="border-b" />
                        {Array.from({ length: daysInMonth }, (_, i) => (
                          <div
                            key={i}
                            className="text-xs font-medium text-center text-muted-foreground border-b"
                          >
                            {i + 1}
                          </div>
                        ))}

                        {/* Project Rows */}
                        {projectData.map((project) => {
                          const start = new Date(project.startDate);
                          const end = new Date(project.endDate);

                          // Optional: set hours to avoid time-zone issues
                          start.setHours(0, 0, 0, 0);
                          end.setHours(23, 59, 59, 999);

                          // Check overlap with the chosen month
                          const firstDayOfMonth = new Date(
                            selectedYear,
                            selectedMonth,
                            1
                          );
                          const lastDayOfMonth = new Date(
                            selectedYear,
                            selectedMonth,
                            daysInMonth
                          );
                          const intersectsMonth =
                            end >= firstDayOfMonth && start <= lastDayOfMonth;
                          if (!intersectsMonth) return null;

                          return (
                            <Fragment key={project.id}>
                              {/* Project Name & Date Range */}
                              <div className="text-xs font-medium pr-2 border-b border-r">
                                <div className="truncate">
                                  {project.projectName}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {format(start, "dd/MM/yyyy")} -{" "}
                                  {format(end, "dd/MM/yyyy")}
                                </div>
                              </div>

                              {/* Day-by-Day Cells */}
                              {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                                const dayDate = new Date(
                                  selectedYear,
                                  selectedMonth,
                                  dayIndex + 1
                                );

                                const isWithinRange =
                                  dayDate >= start && dayDate <= end;
                                if (!isWithinRange) {
                                  return (
                                    <div
                                      key={dayIndex}
                                      className="border-b border-r h-8"
                                    />
                                  );
                                }

                                // Check if it's the exact start/end day
                                const isProjectStartDay =
                                  dayDate.toDateString() === start.toDateString();
                                const isProjectEndDay =
                                  dayDate.toDateString() === end.toDateString();

                                return (
                                  <div
                                    key={dayIndex}
                                    className="relative h-8 flex items-center justify-center border-b border-r"
                                  >
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div
                                              className={`absolute inset-0 border-y ${
                                                project.status === "High Risk"
                                                  ? "bg-red-500/20 border-red-500"
                                                  : project.status === "Low Risk"
                                                  ? "bg-green-500/20 border-green-500"
                                                  : "bg-blue-500/20 border-blue-500"
                                              } ${
                                                isProjectStartDay
                                                  ? "border-l"
                                                  : ""
                                              } ${
                                                isProjectEndDay
                                                  ? "border-r"
                                                  : ""
                                              }`}
                                            />
                                            {(isProjectStartDay ||
                                              isProjectEndDay) && (
                                              <span
                                                className={`text-[10px] z-10 font-medium ${
                                                  project.status === "High Risk"
                                                    ? "text-red-500"
                                                    : project.status === "Low Risk"
                                                    ? "text-green-500"
                                                    : "text-blue-500"
                                                }`}
                                              >
                                                {isProjectStartDay
                                                  ? format(start, "dd")
                                                  : format(end, "dd")}
                                              </span>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="space-y-1">
                                            <p className="font-medium">
                                              {project.projectName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {format(start, "dd MMM yyyy")} -{" "}
                                              {format(end, "dd MMM yyyy")}
                                            </p>
                                            <p className="text-xs">
                                              Status: {project.status}
                                            </p>
                                            <p className="text-xs">
                                              Category: {project.category}
                                            </p>
                                            <p className="text-xs">
                                              Team: {project.assignedTo}
                                            </p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

const jobListings = [
  {
    id: 1,
    title: "Commercial Diver Needed",
    company: "Ocean Tech Solutions",
    location: "Gulf of Mexico",
    duration: "3 months",
    startDate: "2024-02-15",
    requirements: "5+ years experience, Sat certification",
  },
  {
    id: 2,
    title: "Underwater Welder",
    company: "Deep Sea Operations",
    location: "North Sea",
    duration: "6 months",
    startDate: "2024-03-01",
    requirements: "Welding certification, 3+ years experience",
  },
];

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
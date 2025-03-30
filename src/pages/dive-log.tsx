import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, Calendar, Waves, Download } from "lucide-react";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistance } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DiveLog {
  id: number;
  date: string;
  diveNumber: string;
  company: string;
  contractor: string;
  location: string;
  vessel: string;
  diveType: string;
  maxDepth: number;
  bottomTime: number;
  supervisor: string;
  workDescription: string;
}

export default function DiveLog() {
  const [selectedLog, setSelectedLog] = useState<DiveLog | null>(null);

  // Fetch dive logs
  const { data: recentDives = [] } = useQuery<DiveLog[]>({
    queryKey: ["/api/dive-logs"],
    queryFn: async () => {
      const response = await fetch("/api/dive-logs");
      if (!response.ok) {
        throw new Error("Failed to fetch dive logs");
      }
      return response.json();
    },
  });

  // Calculate statistics
  const totalDives = recentDives.length;
  const totalMinutes = recentDives.reduce(
    (acc, dive) => acc + dive.bottomTime,
    0,
  );

  // Calculate minutes this month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const minutesThisMonth = recentDives
    .filter((dive) => {
      const diveDate = new Date(dive.date);
      return (
        diveDate.getMonth() === currentMonth &&
        diveDate.getFullYear() === currentYear
      );
    })
    .reduce((acc, dive) => acc + dive.bottomTime, 0);

  // Function to export dive logs to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Dive Log Report', 15, 15);

    // Add statistics
    doc.setFontSize(12);
    doc.text(`Total Dives: ${totalDives}`, 15, 25);
    doc.text(`Total Minutes: ${totalMinutes}`, 15, 32);
    doc.text(`Minutes This Month: ${minutesThisMonth}`, 15, 39);

    // Add dive logs table
    const tableData = recentDives.map(dive => [
      new Date(dive.date).toLocaleDateString(),
      dive.diveNumber,
      dive.company,
      dive.location,
      `${dive.maxDepth}m`,
      `${dive.bottomTime}min`,
      dive.supervisor
    ]);

    autoTable(doc, {
      head: [['Date', 'Dive #', 'Company', 'Location', 'Max Depth', 'Bottom Time', 'Supervisor']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // Add detailed logs
    let yPos = doc.lastAutoTable.finalY + 15;

    recentDives.forEach((dive, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 15;
      }

      doc.setFontSize(14);
      doc.text(`Dive Log #${dive.diveNumber}`, 15, yPos);

      doc.setFontSize(10);
      yPos += 10;

      const details = [
        `Date: ${new Date(dive.date).toLocaleDateString()}`,
        `Company: ${dive.company}`,
        `Contractor: ${dive.contractor}`,
        `Location: ${dive.location}`,
        `Vessel: ${dive.vessel}`,
        `Dive Type: ${dive.diveType}`,
        `Maximum Depth: ${dive.maxDepth}m`,
        `Bottom Time: ${dive.bottomTime} minutes`,
        `Supervisor: ${dive.supervisor}`,
        `Work Description:`,
        dive.workDescription
      ];

      details.forEach(detail => {
        // Check if we need a new page
        if (yPos > 280) {
          doc.addPage();
          yPos = 15;
        }

        doc.text(detail, 15, yPos);
        yPos += 7;
      });

      yPos += 10; // Add space between dive logs
    });

    // Save the PDF
    doc.save('dive-logs.pdf');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dive Log</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export to PDF
            </Button>
            <Link href="/dive-log/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Dive
              </Button>
            </Link>
          </div>
        </div>

        {/* Dive Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Waves className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">
                      Total Dives
                    </p>
                    <p className="text-2xl font-bold">{totalDives}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">
                      Total Minutes
                    </p>
                    <p className="text-2xl font-bold">{totalMinutes}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">
                      Minutes This Month
                    </p>
                    <p className="text-2xl font-bold">{minutesThisMonth}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Dives</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDives.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Dive #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Work Description</TableHead>
                    <TableHead>Supervisor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDives.map((dive) => (
                    <TableRow
                      key={dive.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLog(dive)}
                    >
                      <TableCell>
                        {new Date(dive.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{dive.diveNumber}</TableCell>
                      <TableCell>{dive.company}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {dive.workDescription}
                      </TableCell>
                      <TableCell>{dive.supervisor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No dive logs found</p>
                <Link href="/dive-log/new">
                  <Button variant="outline" className="mt-4">
                    Log Your First Dive
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Dive Log Details</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
              {selectedLog && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Date
                      </h4>
                      <p>{new Date(selectedLog.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Dive Number
                      </h4>
                      <p>{selectedLog.diveNumber}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Company
                      </h4>
                      <p>{selectedLog.company}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Contractor
                      </h4>
                      <p>{selectedLog.contractor}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Location
                      </h4>
                      <p>{selectedLog.location}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Vessel
                      </h4>
                      <p>{selectedLog.vessel}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Dive Type
                      </h4>
                      <p>{selectedLog.diveType}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Maximum Depth
                      </h4>
                      <p>{selectedLog.maxDepth} meters</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Bottom Time
                      </h4>
                      <p>{selectedLog.bottomTime} minutes</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Supervisor
                      </h4>
                      <p>{selectedLog.supervisor}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-2">
                      Work Description
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {selectedLog.workDescription}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
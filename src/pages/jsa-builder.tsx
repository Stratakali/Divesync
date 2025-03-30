import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";
import { ClipboardCheck, Wrench, FileText, Plus, Search, FileDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type JSARecord = {
  id: number;
  projectName: string;
  location: string;
  date: string;
  supervisor: string;
  divingMode: string;
  maxDepth: string;
  tasks?: Array<{
    stepNumber: number;
    taskDescription: string;
    hazards: string;
    controls: string;
    riskLevel: string;
  }>;
  requiredPPE?: string[];
};

function generateJSAReport(record: JSARecord) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  // Warning Header
  doc.setFillColor(255, 0, 0);
  doc.setTextColor(255, 0, 0);
  doc.setFontSize(12);
  doc.text("DO NOT PROCEED WITH WORK IF REVISED RISK RATING IS EXTREME", pageWidth / 2, margin, { align: "center" });

  // Section 2 Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text("SECTION 2: COMPLETE IF ANY ADDITIONAL HAZARDS ARE PRESENT ON THE DAY WORK IS CARRIED OUT, THAT WERE NOT IDENTIFIED IN THE ABOVE ASSESSMENT.", margin, margin + 15);
  doc.text("(Examples of these may be environmental hazards such as adverse weather conditions, hazards introduced by another party or at a new site etc)", margin, margin + 22);

  // Task Analysis Table
  if (record.tasks && record.tasks.length > 0) {
    // Column headers
    const headers = [
      [
        { content: 'TASK DESCRIPTION', styles: { halign: 'center' } },
        { content: 'POTENTIAL HAZARDS', styles: { halign: 'center' } },
        { content: 'INITIAL\nRISK\nRATING', styles: { halign: 'center' } },
        { content: 'CONTROL MEASURES', styles: { halign: 'center' } },
        { content: 'REVISED\nRISK\nRATING', styles: { halign: 'center' } }
      ]
    ];

    // Format task data
    const tableData = record.tasks.map((task, index) => [
      { content: `${index + 1}. ${task.taskDescription}` },
      { content: task.hazards },
      { content: task.riskLevel },
      { content: task.controls },
      { content: task.riskLevel } // You might want to add a revised risk level field
    ]);

    // Create the table
    autoTable(doc, {
      startY: margin + 30,
      head: headers,
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 45 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 20 }
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });

    // Sign-off Section
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("SECTION 3: SIGN OFF (before commencing task)", margin, finalY);
    doc.setFontSize(9);
    doc.text("All persons performing the work are to sign below to confirm:", margin, finalY + 10);
    doc.text("- I have disclosed all known hazards and risk being brought onto site/arising from the work being undertaken", margin + 5, finalY + 20);
    doc.text("- I have been consulted and given the opportunity to contribute to the JSA", margin + 5, finalY + 27);
    doc.text("- I have read, understood and agree to follow the procedure and controls outlined in the JSA", margin + 5, finalY + 34);

    // Create sign-off table
    autoTable(doc, {
      startY: finalY + 40,
      head: [["Names of person(s) performing the work:", "Signature:", "Date:"]],
      body: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'normal'
      }
    });

    // Site Representative Section
    const signY = (doc as any).lastAutoTable.finalY + 10;
    doc.text("DairyNZ Site Representative to sign below to confirm:", margin, signY);
    doc.text("- I have disclosed all known hazards and risk being brought onto site/arising from the work being undertaken", margin + 5, signY + 10);
    doc.text("- I have been consulted and given the opportunity to contribute to the JSA", margin + 5, signY + 17);
    doc.text("- I have read, understood and agree to follow the procedure and controls outlined in the JSA", margin + 5, signY + 24);

    // Create site representative sign-off table
    autoTable(doc, {
      startY: signY + 30,
      head: [["Name of DairyNZ Site Representative:", "Signature:", "Date:"]],
      body: [["", "", ""]],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'normal'
      }
    });
  }

  // Save the PDF
  doc.save(`JSA_${record.projectName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export default function JSABuilder() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: jsaRecords = [], isLoading: jsaLoading } = useQuery({
    queryKey: ["jsa"],
    queryFn: async () => {
      const response = await fetch("/api/jsa");
      if (!response.ok) {
        throw new Error("Failed to fetch JSA records");
      }
      return response.json();
    },
  });

  const { data: toolboxRecords = [], isLoading: toolboxLoading } = useQuery({
    queryKey: ["toolbox"],
    queryFn: async () => {
      const response = await fetch("/api/toolbox");
      if (!response.ok) {
        throw new Error("Failed to fetch toolbox records");
      }
      return response.json();
    },
  });

  const { data: swmsRecords = [], isLoading: swmsLoading } = useQuery({
    queryKey: ["swms"],
    queryFn: async () => {
      const response = await fetch("/api/swms");
      if (!response.ok) {
        throw new Error("Failed to fetch SWMS records");
      }
      return response.json();
    },
  });

  const filterRecords = (records: any[], term: string) => {
    return records.filter((record) =>
      Object.values(record).some(
        (value) => value?.toString().toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover:bg-accent/50 transition-colors">
            <Link href="/jsa-builder/new">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  JSA Builder
                </CardTitle>
                <CardDescription>
                  Create and manage Job Safety Analysis documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  New JSA
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors">
            <Link href="/toolbox/new">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Toolbox Talks
                </CardTitle>
                <CardDescription>
                  Access and record daily toolbox talks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  New Toolbox Talk
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors">
            <Link href="/swms/new">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SWMS Builder
                </CardTitle>
                <CardDescription>
                  Create Safe Work Method Statements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  New SWMS
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Safety Documentation</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="jsa">
              <TabsList className="mb-4">
                <TabsTrigger value="jsa" className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  JSA Records
                </TabsTrigger>
                <TabsTrigger value="toolbox" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Toolbox Records
                </TabsTrigger>
                <TabsTrigger value="swms" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  SWMS Records
                </TabsTrigger>
              </TabsList>

              <TabsContent value="jsa">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Diving Mode</TableHead>
                      <TableHead>Max Depth</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jsaLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading records...
                        </TableCell>
                      </TableRow>
                    ) : filterRecords(jsaRecords, searchTerm).map((record: JSARecord) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.projectName}</TableCell>
                        <TableCell>{record.location}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.supervisor}</TableCell>
                        <TableCell>{record.divingMode}</TableCell>
                        <TableCell>{record.maxDepth}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateJSAReport(record)}
                              className="flex items-center gap-1"
                            >
                              <FileDown className="h-4 w-4" />
                              Generate Report
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="toolbox">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolboxLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Loading records...
                        </TableCell>
                      </TableRow>
                    ) : filterRecords(toolboxRecords, searchTerm).map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.topic}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.conductor}</TableCell>
                        <TableCell>{record.location}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="swms">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {swmsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Loading records...
                        </TableCell>
                      </TableRow>
                    ) : filterRecords(swmsRecords, searchTerm).map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.projectName}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.location}</TableCell>
                        <TableCell>{record.companyName}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
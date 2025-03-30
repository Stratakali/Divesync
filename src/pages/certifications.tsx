import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectSeparator, SelectLabel } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { BarChart, FileText, Download } from "lucide-react";
import type { SelectCertification } from "@db/schema";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, differenceInMonths, isBefore, getYear } from 'date-fns';
import React from 'react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const certificationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  certificationNumber: z.string().min(1, "Certification number is required"),
  issuedDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  issuingAuthority: z.string().min(1, "Issuing authority is required"),
  type: z.string().min(1, "Type is required"),
  document: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, "Document is required")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      "Max file size is 5MB"
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .pdf files are accepted"
    )
    .optional(),
});

const certificationTypes = [
  { value: "diver", label: "Diver Certification", isEssential: true },
  { value: "firstaid", label: "First Aid", isEssential: true },
  { value: "oxygen", label: "Oxygen Provider", isEssential: true },
  { value: "medical", label: "Medical", isEssential: true },
  { value: "Commercial Diving", label: "Commercial Diving", isEssential: false },
  { value: "Recreational Diving", label: "Recreational Diving", isEssential: false },
  { value: "Technical Diving", label: "Technical Diving", isEssential: false },
  { value: "Safety", label: "Safety", isEssential: false },
  { value: "Other", label: "Other", isEssential: false },
];

const calculateCertStatus = (expiryDate: string) => {
  const today = new Date();
  const expiryDay = new Date(expiryDate);

  if (isBefore(expiryDay, today)) {
    return {
      status: "expired",
      color: "bg-red-500",
      text: "Expired"
    };
  }

  const monthsUntilExpiry = differenceInMonths(expiryDay, today);

  if (monthsUntilExpiry <= 1) {
    return {
      status: "critical",
      color: "bg-red-500",
      text: `Expires in ${monthsUntilExpiry} month`
    };
  } else if (monthsUntilExpiry <= 3) {
    return {
      status: "warning",
      color: "bg-orange-500",
      text: `Expires in ${monthsUntilExpiry} months`
    };
  } else {
    return {
      status: "valid",
      color: "bg-green-500",
      text: "Valid"
    };
  }
};

export default function Certifications() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof certificationSchema>>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: "",
      certificationNumber: "",
      issuedDate: "",
      expiryDate: "",
      issuingAuthority: "",
      type: "",
    },
  });

  const { data: certifications = [] } = useQuery<SelectCertification[]>({
    queryKey: ["/api/certifications"],
  });

  const addCertification = useMutation({
    mutationFn: async (data: z.infer<typeof certificationSchema>) => {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'document') {
          formData.append(key, value);
        }
      });

      if (data.document?.[0]) {
        formData.append('document', data.document[0]);
      }

      const res = await fetch("/api/certifications", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({
        title: "Success",
        description: "Certification added successfully",
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const exportToPDF = async () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Certifications Report', 15, 15);

    doc.setFontSize(12);
    doc.text(`Total Certifications: ${certifications.length}`, 15, 25);

    const tableData = certifications.map(cert => [
      cert.name,
      cert.certificationNumber,
      cert.type,
      cert.issuingAuthority,
      new Date(cert.issuedDate).toLocaleDateString(),
      new Date(cert.expiryDate).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [['Name', 'Number', 'Type', 'Authority', 'Issued', 'Expires']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    let yPos = doc.lastAutoTable.finalY + 15;

    for (const cert of certifications) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 15;
      }

      doc.setFontSize(14);
      doc.text(`${cert.name}`, 15, yPos);

      doc.setFontSize(10);
      yPos += 10;

      const details = [
        `Certification Number: ${cert.certificationNumber}`,
        `Type: ${cert.type}`,
        `Issuing Authority: ${cert.issuingAuthority}`,
        `Issue Date: ${new Date(cert.issuedDate).toLocaleDateString()}`,
        `Expiry Date: ${new Date(cert.expiryDate).toLocaleDateString()}`
      ];

      for (const detail of details) {
        if (yPos > 280) {
          doc.addPage();
          yPos = 15;
        }

        doc.text(detail, 15, yPos);
        yPos += 7;
      }

      if (cert.documentUrl) {
        try {
          const response = await fetch(cert.documentUrl);
          const blob = await response.blob();

          const reader = new FileReader();
          const base64data = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          if (yPos > 160) {
            doc.addPage();
            yPos = 15;
          }

          yPos += 10;
          doc.text('Document:', 15, yPos);
          yPos += 10;

          if (blob.type.startsWith('image/')) {
            doc.addImage(
              base64data as string,
              blob.type.split('/')[1].toUpperCase(),
              15,
              yPos,
              180,
              100
            );
            yPos += 110;
          }
        } catch (error) {
          console.error('Error adding document to PDF:', error);
          doc.text('Error: Could not load document', 15, yPos);
          yPos += 10;
        }
      }

      yPos += 20;
    }

    doc.save('certifications.pdf');
  };

  const essentialCertifications = [
    { name: "Diver Certification", type: "diver" },
    { name: "First Aid", type: "firstaid" },
    { name: "Oxygen Provider", type: "oxygen" },
    { name: "Medical", type: "medical" }
  ];

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = Array.from(
    { length: 5 },
    (_, i) => currentYear + i
  );

  const groupCertificationsByMonth = () => {
    const monthlyGroups: Record<number, SelectCertification[]> = {};

    certifications.forEach(cert => {
      const expiryDate = new Date(cert.expiryDate);
      if (getYear(expiryDate) === selectedYear) {
        const month = expiryDate.getMonth();
        if (!monthlyGroups[month]) {
          monthlyGroups[month] = [];
        }
        monthlyGroups[month].push(cert);
      }
    });

    return monthlyGroups;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Certifications</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: "Processing",
                  description: "Generating PDF, please wait...",
                });
                exportToPDF().catch((error) => {
                  console.error('Error generating PDF:', error);
                  toast({
                    title: "Error",
                    description: "Failed to generate PDF",
                    variant: "destructive",
                  });
                });
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export to PDF
            </Button>
            <Link href="/certifications/timeline">
              <Button variant="outline">
                <BarChart className="w-4 h-4 mr-2" />
                View Timeline
              </Button>
            </Link>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add Certification"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Essential Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {essentialCertifications.map((cert) => {
                const existingCert = certifications.find(c =>
                  c.type.toLowerCase() === cert.type.toLowerCase()
                );

                let statusInfo = {
                  status: "not-added",
                  color: "bg-red-500",
                  text: "Not Added"
                };

                if (existingCert) {
                  statusInfo = calculateCertStatus(existingCert.expiryDate);
                }

                return (
                  <div key={cert.type} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center bg-gray-800/50 p-2 rounded-lg">
                        <div className={`w-6 h-6 rounded-full shadow-lg ${statusInfo.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        {existingCert && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Expires: {format(new Date(existingCert.expiryDate), "dd MMM yyyy")}
                            </p>
                            <p className={`text-sm ${
                              statusInfo.status === "expired" || statusInfo.status === "not-added" ? "text-red-500" :
                                statusInfo.status === "critical" ? "text-red-400" :
                                statusInfo.status === "warning" ? "text-orange-500" :
                                "text-green-500"
                            }`}>
                              {statusInfo.text}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {!existingCert ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowForm(true);
                            form.setValue('type', cert.type);
                            form.setValue('name', cert.name);
                            document.querySelector('#certification-form')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Add Essential Certification
                        </Button>
                      ) : (
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            statusInfo.status === "expired" || statusInfo.status === "not-added" ? "text-red-500" :
                              statusInfo.status === "critical" ? "text-red-400" :
                              statusInfo.status === "warning" ? "text-orange-500" :
                              "text-green-500"
                          }`}>
                            {statusInfo.text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Certification Timeline */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Expiry Timeline</CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <div className="min-w-full">
                {/* Certifications and their expiry markers */}
                <div className="grid" style={{ 
                  gridTemplateColumns: 'minmax(120px, auto) repeat(12, 1fr)',
                  gap: '0.2rem'
                }}>
                  {/* Header Row with Months */}
                  <div></div> {/* Empty cell for alignment */}
                  {["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((month) => (
                    <div key={month} className="text-xs font-medium text-center text-muted-foreground">
                      {month}
                    </div>
                  ))}

                  {/* Certification Rows */}
                  {certifications.map((cert) => {
                    const expiryDate = new Date(cert.expiryDate);
                    const issueDate = new Date(cert.issuedDate);
                    const expiryMonth = expiryDate.getMonth();
                    const issueMonth = issueDate.getMonth();
                    const expiryYear = expiryDate.getFullYear();
                    const issueYear = issueDate.getFullYear();
                    const status = calculateCertStatus(cert.expiryDate);

                    return (
                      <React.Fragment key={cert.id}>
                        {/* Certification Name */}
                        <div className="text-xs font-medium truncate pr-2">{cert.name}</div>

                        {/* Month Cells */}
                        {Array.from({ length: 12 }, (_, month) => (
                          <div key={month} className="relative h-6 flex items-center justify-center">
                            {selectedYear >= issueYear && selectedYear <= expiryYear && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                {/* Bar showing certification validity period */}
                                {(selectedYear > issueYear || (selectedYear === issueYear && month >= issueMonth)) && 
                                 (selectedYear < expiryYear || (selectedYear === expiryYear && month <= expiryMonth)) && (
                                  <div
                                    className={`absolute inset-0 border-y ${
                                      status.status === "expired" ? "bg-red-500/20 border-red-500" :
                                      status.status === "warning" ? "bg-orange-500/20 border-orange-500" :
                                      "bg-green-500/20 border-green-500"
                                    } ${
                                      // Add left border only for issue month in issue year
                                      selectedYear === issueYear && month === issueMonth ? "border-l" : ""
                                    } ${
                                      // Add right border only for expiry month in expiry year
                                      selectedYear === expiryYear && month === expiryMonth ? "border-r" : ""
                                    }`}
                                  />
                                )}

                                {/* Issue date marker */}
                                {selectedYear === issueYear && month === issueMonth && (
                                  <div className="absolute left-0 w-0.5 h-full bg-blue-500" />
                                )}

                                {/* Expiry date marker */}
                                {selectedYear === expiryYear && month === expiryMonth && (
                                  <span className={`text-[10px] z-10 font-medium ${
                                    status.status === "expired" ? "text-red-500" :
                                    status.status === "warning" ? "text-orange-500" :
                                    "text-green-500"
                                  }`}>
                                    {format(expiryDate, "dd")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card id="certification-form">
            <CardHeader>
              <CardTitle>
                {form.getValues('type') && certificationTypes.find(t => t.value === form.getValues('type'))?.isEssential
                  ? 'Add Essential Certification'
                  : 'Add New Certification'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => addCertification.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certification Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter certification name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certification Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter certification number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select certification type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Essential Certifications</SelectLabel>
                              {certificationTypes
                                .filter(type => type.isEssential)
                                .map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>Other Certifications</SelectLabel>
                              {certificationTypes
                                .filter(type => !type.isEssential)
                                .map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuingAuthority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Authority</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter issuing authority" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Upload Document</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept={ACCEPTED_FILE_TYPES.join(',')}
                            onChange={(e) => onChange(e.target.files)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">Add Certification</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {certifications.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert) => (
              <Card key={cert.id}>
                <CardHeader>
                  <CardTitle>{cert.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-1 text-sm">
                    <dt className="font-medium">Number:</dt>
                    <dd className="text-muted-foreground">{cert.certificationNumber}</dd>
                    <dt className="font-medium">Type:</dt>
                    <dd className="text-muted-foreground">{cert.type}</dd>
                    <dt className="font-medium">Issuer:</dt>
                    <dd className="text-muted-foreground">{cert.issuingAuthority}</dd>
                    <dt className="font-medium">Valid Until:</dt>
                    <dd className="text-muted-foreground">
                      {new Date(cert.expiryDate).toLocaleDateString()}
                    </dd>
                  </dl>
                  {cert.documentUrl && (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center mt-4 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Document
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No certifications added yet. Click the button above to add your first certification.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
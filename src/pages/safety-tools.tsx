import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ClipboardCheck, Wrench, FileText } from "lucide-react";

export default function SafetyTools() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Safety Tools</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover:bg-accent/50 transition-colors">
            <Link href="/jsa-builder">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  JSA Builder
                </CardTitle>
                <CardDescription>
                  Create and manage Job Safety Analysis documents for your diving operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  Open JSA Builder
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors">
            <Link href="/toolbox">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Toolbox Talks
                </CardTitle>
                <CardDescription>
                  Access and record daily toolbox talks and safety briefings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  Open Toolbox
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors">
            <Link href="/swms">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SWMS Builder
                </CardTitle>
                <CardDescription>
                  Create Safe Work Method Statements for diving projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  Open SWMS Builder
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
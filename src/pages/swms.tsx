import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ClipboardCheck, Wrench, FileText } from "lucide-react";

export default function SWMS() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">SWMS Builder</h1>
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Safety Tools Navigation Widgets */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover:bg-accent/50 transition-colors">
            <Link href="/jsa-builder">
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
                  Access and record daily toolbox talks
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
                  Create Safe Work Method Statements
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

        {/* SWMS Builder Content Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Safe Work Method Statement Builder</CardTitle>
            <CardDescription>
              Create and manage detailed safe work method statements for diving operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              SWMS builder functionality coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

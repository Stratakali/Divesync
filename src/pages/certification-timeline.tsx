import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { SelectCertification } from "@db/schema";

type ChartData = {
  name: string;
  validDays: number;
  remainingDays: number;
};

export default function CertificationTimeline() {
  const { data: certifications = [] } = useQuery<SelectCertification[]>({
    queryKey: ["/api/certifications"],
  });

  const chartData: ChartData[] = certifications.map((cert) => {
    const today = new Date();
    const issuedDate = new Date(cert.issuedDate);
    const expiryDate = new Date(cert.expiryDate);

    return {
      name: cert.name,
      validDays: differenceInDays(expiryDate, issuedDate),
      remainingDays: differenceInDays(expiryDate, today),
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Certification Timeline</h1>
        </div>

        {certifications.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Expiry Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                  >
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip 
                      formatter={(value: number) => `${value} days`}
                      labelFormatter={(label: string) => `${label}`}
                    />
                    <Bar 
                      dataKey="validDays" 
                      fill="#3b82f6"
                      name="Total Duration"
                    />
                    <Bar 
                      dataKey="remainingDays" 
                      fill="#22c55e"
                      name="Days Remaining"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No certifications found. Add certifications to view their timeline.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

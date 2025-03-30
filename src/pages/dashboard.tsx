import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Briefcase, Calculator, Clipboard, UserCircle, Waves } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DisclaimerModal } from "@/components/ui/disclaimer-modal";

const features = [
  {
    icon: UserCircle,
    title: "Profile",
    description: "View and manage your diver profile",
    href: "/profile",
  },
  {
    icon: Waves,
    title: "Dive Log",
    description: "Track and manage your diving history",
    href: "/dive-log",
  },
  {
    icon: Award,
    title: "Certifications",
    description: "Manage your diving certifications",
    href: "/certifications",
  },
  {
    icon: Calculator,
    title: "Dive Planner",
    description: "Plan your dives with advanced gas calculations",
    href: "/dive-planner",
  },
  {
    icon: Clipboard,
    title: "JSA Builder",
    description: "Create Job Safety Analysis documents",
    href: "/jsa-builder",
  },
  {
    icon: Briefcase,
    title: "Job Board",
    description: "Find diving opportunities",
    href: "/job-board",
  },
];

export default function Dashboard() {
  const { data } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    },
  });

  // Show disclaimer if user hasn't accepted it
  if (data?.authenticated && !data.user.disclaimerAccepted) {
    return <DisclaimerModal />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div 
          className="relative py-16"
          style={{
            backgroundImage: "url('/images/coastal-banner.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Semi-transparent overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />

          <div className="container relative z-10">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to DiveSYNC</h1>
            <p className="text-xl text-blue-100">
              Manage your diving career with our comprehensive tools and resources.
            </p>
          </div>
        </div>

        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link key={feature.href} href={feature.href}>
                <Card className="hover:bg-accent/80 cursor-pointer transition-colors bg-background/80">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
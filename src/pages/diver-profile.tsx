import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInMonths, isBefore } from "date-fns";
import type {
  SelectDiverProfile,
  SelectDiveLog,
  SelectCertification,
} from "@db/schema";
import {
  Activity,
  Waves,
  Clock,
  Award,
  FileText,
  UserCircle,
  Edit2,
  Calendar,
  Camera,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Link } from "wouter";

export default function DiverProfile() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");

  const { data: profile } = useQuery<SelectDiverProfile>({
    queryKey: ["/api/diver/profile"],
  });

  const { data: recentLogs = [] } = useQuery<SelectDiveLog[]>({
    queryKey: ["/api/diver/logs"],
  });

  const { data: certifications = [] } = useQuery<SelectCertification[]>({
    queryKey: ["/api/certifications"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { bio: string }) => {
      const response = await fetch("/api/diver/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diver/profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/diver/profile/image", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload image");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diver/profile"] });
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  const handleBioSave = () => {
    updateProfileMutation.mutate({ bio });
  };

  const readinessColor = {
    Available: "text-green-500",
    "On Job": "text-yellow-500",
    Unavailable: "text-red-500",
  }[profile?.readinessStatus || "Unavailable"];

  const calculateCertStatus = (expiryDate: string) => {
    const today = new Date();
    if (isBefore(new Date(expiryDate), today)) {
      return "expired";
    }
    const monthsUntilExpiry = differenceInMonths(new Date(expiryDate), today);
    return monthsUntilExpiry <= 3 ? "expiring" : "valid";
  };

  const certificationStats = certifications.reduce((acc, cert) => {
    const status = calculateCertStatus(cert.expiryDate);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { valid: 0, expiring: 0, expired: 0 } as Record<string, number>);

  const calculateProfileCompletion = (profile: SelectDiverProfile | undefined) => {
    if (!profile) return 0;

    const fields = [
      profile.fullName,
      profile.location,
      profile.dateOfBirth,
      profile.emergencyContactName,
      profile.emergencyContactPhone,
      profile.emergencyContactRelation,
      profile.bio,
      profile.imageUrl,
    ];

    const completedFields = fields.filter(field => field).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const completionPercentage = calculateProfileCompletion(profile);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <div
                  onClick={handleImageClick}
                  className="relative cursor-pointer group"
                >
                  <div className="w-24 h-24 rounded-full bg-blue-950/50 flex items-center justify-center text-blue-200 overflow-hidden">
                    {profile?.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-16 h-16" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-center md:text-left flex-grow">
                <h2 className="text-2xl font-bold mb-2">{user?.username}</h2>
                <div className="relative">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself, your diving experience, and expertise..."
                        className="min-h-[100px] bg-white/5 border-gray-700 text-foreground resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleBioSave}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setIsEditing(true);
                        setBio(profile?.bio || "");
                      }}
                    >
                      <p className="text-sm text-muted-foreground min-h-[60px] p-2 rounded-md hover:bg-white/5">
                        {profile?.bio || "Click to add a bio"}
                      </p>
                      <Edit2 className="w-4 h-4 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
                <div
                  className={`flex items-center gap-2 font-semibold mt-2 justify-center md:justify-start ${readinessColor}`}
                >
                  <Activity className="h-4 w-4" />
                  {profile?.readinessStatus || "Unavailable"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion and Certification Status */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  {completionPercentage}% complete
                </p>
                <Link href="/profile-completion">
                  <Button variant="outline" size="sm">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Certification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold">{certificationStats.valid}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
                <div className="text-center">
                  <div className="w-4 h-4 rounded-full bg-orange-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold">{certificationStats.expiring}</p>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                </div>
                <div className="text-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold">{certificationStats.expired}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Essential Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Essential Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Diver Certification", type: "diver" },
                { name: "First Aid", type: "firstaid" },
                { name: "Oxygen Provider", type: "oxygen" },
                { name: "Medical", type: "medical" }
              ].map((cert) => {
                const existingCert = certifications.find(c => 
                  c.type.toLowerCase() === cert.type.toLowerCase()
                );

                let status = "not-added";
                let statusColor = "bg-gray-500";
                let statusText = "Not Added";

                if (existingCert) {
                  status = calculateCertStatus(existingCert.expiryDate);
                  statusColor = {
                    valid: "bg-green-500",
                    expiring: "bg-orange-500",
                    expired: "bg-red-500"
                  }[status];
                  statusText = {
                    valid: "Valid",
                    expiring: "Expiring Soon",
                    expired: "Expired"
                  }[status];
                }

                return (
                  <div
                    key={cert.type}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        {existingCert && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {format(new Date(existingCert.expiryDate), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {!existingCert ? (
                        <Link href="/certifications">
                          <Button variant="outline" size="sm">
                            Add
                          </Button>
                        </Link>
                      ) : (
                        <p className="text-sm font-medium">{statusText}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dives</CardTitle>
              <Waves className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.totalDives || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime dives logged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Deepest Dive
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.deepestDive || 0}m
              </div>
              <p className="text-xs text-muted-foreground">
                Personal best depth
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Longest Dive
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.longestDive || 0} min
              </div>
              <p className="text-xs text-muted-foreground">
                Personal best duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Dive</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.lastDiveDate
                  ? format(new Date(profile.lastDiveDate), "dd MMM yyyy")
                  : "No dives yet"}
              </div>
              <p className="text-xs text-muted-foreground">
                Most recent activity
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Certifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Active Certifications
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certifications.length > 0 ? (
                  certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuingAuthority}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Expires</p>
                        <p className="font-medium">
                          {format(new Date(cert.expiryDate), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      No certifications found
                    </p>
                    <Button variant="outline" className="mt-4">
                      Add Certification
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Dives */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Dives
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{log.location}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.maxDepth}m for {log.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {format(new Date(log.date), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No dive logs found</p>
                    <Button variant="outline" className="mt-4">
                      Log First Dive
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
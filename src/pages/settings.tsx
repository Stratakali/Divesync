import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Globe, Lock, Bell, UserCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showDiveStats, setShowDiveStats] = useState(true);
  const [showCertifications, setShowCertifications] = useState(true);

  const handleThemeChange = (checked: boolean) => {
    setIsDarkMode(checked);
    // TODO: Implement theme change logic
    const theme = checked ? 'dark' : 'light';
    document.documentElement.className = theme;
    toast({
      title: "Theme Updated",
      description: `Switched to ${theme} mode`,
    });
  };

  const handlePrivacyChange = (checked: boolean) => {
    setIsProfilePublic(checked);
    toast({
      title: "Privacy Settings Updated",
      description: `Profile is now ${checked ? 'public' : 'private'}`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="grid gap-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how DiveSync looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={handleThemeChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>
                Control your profile visibility and data sharing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other divers
                  </p>
                </div>
                <Switch
                  checked={isProfilePublic}
                  onCheckedChange={handlePrivacyChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Dive Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your dive stats on your public profile
                  </p>
                </div>
                <Switch
                  checked={showDiveStats}
                  onCheckedChange={setShowDiveStats}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Certifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your certifications on your public profile
                  </p>
                </div>
                <Switch
                  checked={showCertifications}
                  onCheckedChange={setShowCertifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your diving activities
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

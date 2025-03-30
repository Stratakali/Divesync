import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import {
  Clipboard,
  Award,
  Calculator,
  Briefcase,
  LogOut,
  Menu,
  X,
  Waves,
  UserCircle,
  Home,
  Settings,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { icon: UserCircle, label: "Profile", href: "/profile" },
  { icon: Waves, label: "Dive Log", href: "/dive-log" },
  { icon: Award, label: "Certifications", href: "/certifications" },
  { icon: Calculator, label: "Dive Planner", href: "/dive-planner" },
  { icon: Clipboard, label: "JSA Builder", href: "/jsa-builder" },
  { icon: Briefcase, label: "Job Board", href: "/job-board" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useUser();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const NavContent = () => (
    <>
      <div className="mb-4 px-4 py-2">
        <Link href="/">
          <h2 className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">DiveSYNC</h2>
        </Link>
        <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  location === item.href && "bg-blue-950/50"
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20" 
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-16 items-center border-b px-4 bg-black/20 justify-between">
          <div className="flex items-center">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-background/95 backdrop-blur-sm">
                <NavContent />
              </SheetContent>
            </Sheet>
            <Link href="/">
              <div className="ml-4 font-semibold text-xl text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">DiveSYNC</div>
            </Link>
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" className="ml-auto">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <main className="container p-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-72 border-r bg-background/95 backdrop-blur-sm">
        <NavContent />
      </aside>
      <main className="flex-1 bg-background relative">
        <div className="absolute top-4 right-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="container p-8">{children}</div>
      </main>
    </div>
  );
}
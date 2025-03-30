import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function WelcomePage() {
  return (
    <div 
      style={{
        backgroundImage: "url('/images/coastal-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white mb-4">
            Welcome to DiveSYNC
          </h1>
          <p className="text-2xl text-white/90">
            Professional Diving Management Platform
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              variant="outline" 
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Sign Up
            </Button>
          </Link>
        </div>

        <p className="text-white/80 text-lg mt-8">
          Join the community of professional divers
        </p>
      </div>
    </div>
  );
}
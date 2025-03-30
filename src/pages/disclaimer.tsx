import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DisclaimerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch("/api/user/accept-disclaimer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to accept disclaimer");
      }

      await queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Disclaimer Accepted",
        description: "You can now proceed to use the application.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept disclaimer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl bg-card rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Important Disclaimer</h1>
        <div className="space-y-6 text-base">
          <p>
            The dive planner is designed to be used alongside the DCIEM and US Navy Dive Tables
            as a reference tool only. While it provides calculations and suggestions, it should
            not be used as the sole means of dive planning.
          </p>
          <div>
            <p className="mb-4">Users must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be properly trained and certified in diving operations</li>
              <li>Follow all applicable safety regulations and guidelines</li>
              <li>Use this tool in conjunction with official dive tables and procedures</li>
              <li>Exercise proper judgment and risk assessment for each dive</li>
            </ul>
          </div>
          <p className="font-semibold">
            By accepting this disclaimer, you acknowledge that you understand and accept these
            terms and conditions, and that you will use this tool responsibly as part of a
            comprehensive dive planning process.
          </p>
        </div>
        <div className="mt-8">
          <Button
            variant="default"
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full py-6 text-lg"
          >
            {isAccepting ? "Accepting..." : "Accept & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
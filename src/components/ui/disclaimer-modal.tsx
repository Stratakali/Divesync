import { useState } from "react";
import {
  //Dialog,
  //DialogContent,
  //DialogDescription,
  //DialogFooter,
  //DialogHeader,
  //DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface DisclaimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisclaimerModal() {
  const [isAccepting, setIsAccepting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl mx-4">
        <h2 className="text-2xl font-bold mb-4">Important Disclaimer</h2>
        <div className="space-y-4 text-base">
          <p>
            The dive planner is designed to be used alongside the DCIEM and US Navy Dive Tables
            as a reference tool only. While it provides calculations and suggestions, it should
            not be used as the sole means of dive planning.
          </p>
          <p>
            Users must:
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Be properly trained and certified in diving operations</li>
              <li>Follow all applicable safety regulations and guidelines</li>
              <li>Use this tool in conjunction with official dive tables and procedures</li>
              <li>Exercise proper judgment and risk assessment for each dive</li>
            </ul>
          </p>
          <p className="font-semibold">
            By accepting this disclaimer, you acknowledge that you understand and accept these
            terms and conditions, and that you will use this tool responsibly as part of a
            comprehensive dive planning process.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            variant="default"
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full"
          >
            {isAccepting ? "Accepting..." : "Accept & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
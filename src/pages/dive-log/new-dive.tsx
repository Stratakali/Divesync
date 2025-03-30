import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const diveLogSchema = z.object({
  date: z.string(),
  diveNumber: z.string(),
  company: z.string(),
  contractor: z.string(),
  location: z.string(),
  vessel: z.string(),
  diveType: z.enum([
    "Scuba",
    "Surface",
    "Wet Bell",
    "Bell Bounce",
    "Bell Sat",
    "Other",
  ]),
  maxDepth: z.string(),
  bottomTime: z.string(),
  supervisor: z.string(),
  workDescription: z.string(),
});

type DiveLogFormValues = z.infer<typeof diveLogSchema>;

const defaultValues: Partial<DiveLogFormValues> = {
  diveType: "Scuba",
  date: new Date().toISOString().split("T")[0],
};

export default function NewDiveLog() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DiveLogFormValues>({
    resolver: zodResolver(diveLogSchema),
    defaultValues,
  });

  async function onSubmit(data: DiveLogFormValues) {
    try {
      const response = await fetch("/api/dive-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          maxDepth: parseFloat(data.maxDepth),
          bottomTime: parseInt(data.bottomTime, 10),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save dive log");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/dive-logs"] });

      toast({
        title: "Success",
        description: "Dive log saved successfully",
      });

      setLocation("/dive-log");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save dive log",
        variant: "destructive",
      });
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dive-log">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">New Dive Log</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record of Dive</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Dive</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diveNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dive Number</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diving Contractor</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dive Location</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vessel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vessel / Installation</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diveType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Dive</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dive type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Scuba">Scuba</SelectItem>
                            <SelectItem value="Surface">Surface</SelectItem>
                            <SelectItem value="Wet Bell">Wet Bell</SelectItem>
                            <SelectItem value="Bell Bounce">
                              Bell Bounce
                            </SelectItem>
                            <SelectItem value="Bell Sat">Bell Sat</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Depth (meters)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bottomTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalTimeUnderPressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total time under pressure (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supervisor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supervisor</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the work performed, equipment and tools used..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Link href="/dive-log">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit">Save Dive Log</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

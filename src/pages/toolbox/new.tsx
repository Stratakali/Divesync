import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wrench, Users, CloudSun, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const toolboxFormSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  date: z.string(),
  time: z.string(),
  location: z.string().min(1, "Location is required"),
  conductor: z.string().min(1, "Conductor name is required"),
  attendees: z.string().min(1, "Attendee list is required"),
  weatherConditions: z.object({
    temperature: z.string(),
    windSpeed: z.string(),
    visibility: z.string(),
    waveHeight: z.string(),
    currentStrength: z.string(),
  }),
  safetyChecklist: z.array(z.string()).min(1, "At least one safety item must be checked"),
  equipmentChecklist: z.array(z.string()).min(1, "Equipment checks are required"),
  additionalNotes: z.string(),
});

type ToolboxFormValues = z.infer<typeof toolboxFormSchema>;

const defaultValues: Partial<ToolboxFormValues> = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
  safetyChecklist: [],
  equipmentChecklist: [],
};

const SAFETY_ITEMS = [
  { id: "dive-plan", label: "Dive Plan Review" },
  { id: "emergency-procedures", label: "Emergency Procedures" },
  { id: "communication", label: "Communication Signals" },
  { id: "hazard-assessment", label: "Site Hazard Assessment" },
  { id: "decompression", label: "Decompression Schedule" },
  { id: "buddy-check", label: "Buddy Check Procedures" },
];

const EQUIPMENT_ITEMS = [
  { id: "primary-air", label: "Primary Air Supply" },
  { id: "backup-air", label: "Backup Air Supply" },
  { id: "regulators", label: "Regulators" },
  { id: "gauges", label: "Gauges and Instruments" },
  { id: "communication-gear", label: "Communication Equipment" },
  { id: "safety-gear", label: "Safety Equipment" },
];

export default function NewToolbox() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<ToolboxFormValues>({
    resolver: zodResolver(toolboxFormSchema),
    defaultValues,
  });

  const createToolboxMutation = useMutation({
    mutationFn: async (data: ToolboxFormValues) => {
      const response = await fetch("/api/toolbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create toolbox talk");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toolbox"] });
      navigate("/toolbox");
    },
  });

  function onSubmit(data: ToolboxFormValues) {
    createToolboxMutation.mutate(data);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">New Toolbox Talk</h1>
          <Wrench className="h-6 w-6 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Diving Operations - Toolbox Talk</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="equipment-check">Equipment Check</SelectItem>
                            <SelectItem value="emergency-procedures">Emergency Procedures</SelectItem>
                            <SelectItem value="dive-planning">Dive Planning</SelectItem>
                            <SelectItem value="communication">Communication</SelectItem>
                            <SelectItem value="hazard-awareness">Hazard Awareness</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conductor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conductor</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attendees</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List all attendees (one per line)"
                            className="h-[80px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CloudSun className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Weather and Diving Conditions</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weatherConditions.temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weatherConditions.windSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wind Speed (knots)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weatherConditions.visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility (meters)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weatherConditions.waveHeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wave Height (meters)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weatherConditions.currentStrength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Strength (knots)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Safety Checklist</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {SAFETY_ITEMS.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="safetyChecklist"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(field.value?.filter((value) => value !== item.id));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Equipment Checklist</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {EQUIPMENT_ITEMS.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="equipmentChecklist"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(field.value?.filter((value) => value !== item.id));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or comments..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit">Save Toolbox Talk</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
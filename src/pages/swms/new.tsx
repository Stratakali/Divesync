import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, FileText, ShieldCheck, Waves, HardHat, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const workStepSchema = z.object({
  stepNumber: z.number(),
  activity: z.string().min(1, "Activity description is required"),
  hazards: z.string().min(1, "Hazards must be identified"),
  riskLevel: z.enum(["Low", "Medium", "High", "Extreme"]),
  controls: z.string().min(1, "Control measures are required"),
  responsibility: z.string().min(1, "Responsible person must be assigned"),
});

const swmsFormSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  location: z.string().min(1, "Location is required"),
  date: z.string(),
  companyName: z.string().min(1, "Company name is required"),
  scope: z.string().min(1, "Project scope is required"),
  divingMethod: z.enum(["SCUBA", "Surface Supply", "Wet Bell", "Saturation"]),
  maxDepth: z.string().min(1, "Maximum depth is required"),
  workSteps: z.array(workStepSchema),
  equipment: z.array(z.string()).min(1, "Equipment requirements must be specified"),
  ppe: z.array(z.string()).min(1, "PPE requirements must be specified"),
  emergencyProcedures: z.string().min(1, "Emergency procedures must be specified"),
  supervisorName: z.string().min(1, "Supervisor name is required"),
  approvalDate: z.string(),
});

type SWMSFormValues = z.infer<typeof swmsFormSchema>;

const defaultValues: Partial<SWMSFormValues> = {
  date: new Date().toISOString().split('T')[0],
  approvalDate: new Date().toISOString().split('T')[0],
  divingMethod: "SCUBA",
  workSteps: [
    {
      stepNumber: 1,
      activity: "",
      hazards: "",
      riskLevel: "Low",
      controls: "",
      responsibility: "",
    },
  ],
  equipment: [],
  ppe: [],
};

const EQUIPMENT_LIST = [
  { id: "primary-air", label: "Primary Air Supply" },
  { id: "backup-air", label: "Backup Air Supply" },
  { id: "dive-computer", label: "Dive Computer" },
  { id: "communication", label: "Communication System" },
  { id: "lift-bags", label: "Lift Bags" },
  { id: "tools", label: "Underwater Tools" },
];

const PPE_LIST = [
  { id: "dive-suit", label: "Diving Suit" },
  { id: "helmet", label: "Diving Helmet" },
  { id: "harness", label: "Safety Harness" },
  { id: "fins", label: "Fins" },
  { id: "gloves", label: "Diving Gloves" },
  { id: "knife", label: "Diving Knife" },
];

export default function NewSWMS() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<SWMSFormValues>({
    resolver: zodResolver(swmsFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "workSteps",
  });

  const createSWMSMutation = useMutation({
    mutationFn: async (data: SWMSFormValues) => {
      const response = await fetch("/api/swms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create SWMS");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swms"] });
      navigate("/swms");
    },
  });

  function onSubmit(data: SWMSFormValues) {
    createSWMSMutation.mutate(data);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">New SWMS</h1>
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Safe Work Method Statement - Diving Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Project Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Project Information</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Scope</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the scope of diving operations..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Diving Operation Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Waves className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Diving Operation Details</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="divingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diving Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select diving method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SCUBA">SCUBA</SelectItem>
                              <SelectItem value="Surface Supply">Surface Supply</SelectItem>
                              <SelectItem value="Wet Bell">Wet Bell</SelectItem>
                              <SelectItem value="Saturation">Saturation</SelectItem>
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
                  </div>
                </div>

                {/* Work Steps Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Work Method Steps</h3>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({
                        stepNumber: fields.length + 1,
                        activity: "",
                        hazards: "",
                        riskLevel: "Low",
                        controls: "",
                        responsibility: "",
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="p-4">
                        <div className="grid gap-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Step {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`workSteps.${index}.activity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Activity Description</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`workSteps.${index}.hazards`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Potential Hazards</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`workSteps.${index}.riskLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Risk Level</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select risk level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Low">Low</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="High">High</SelectItem>
                                      <SelectItem value="Extreme">Extreme</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`workSteps.${index}.controls`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Control Measures</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`workSteps.${index}.responsibility`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Responsible Person</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Equipment and PPE Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Equipment and PPE Requirements</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <FormLabel>Required Equipment</FormLabel>
                      <div className="grid gap-4">
                        {EQUIPMENT_LIST.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="equipment"
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

                    <div>
                      <FormLabel>Required PPE</FormLabel>
                      <div className="grid gap-4">
                        {PPE_LIST.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="ppe"
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
                  </div>
                </div>

                {/* Emergency Procedures Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Emergency Procedures</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="emergencyProcedures"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Detail emergency response procedures..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Approval Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Approval</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="supervisorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisor Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="approvalDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approval Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Save SWMS</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, HardHat, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const taskSchema = z.object({
  stepNumber: z.number(),
  taskDescription: z.string().min(1, "Task description is required"),
  hazards: z.string().min(1, "Hazards must be identified"),
  controls: z.string().min(1, "Control measures are required"),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"]),
});

const jsaFormSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  location: z.string().min(1, "Location is required"),
  date: z.string(),
  supervisor: z.string().min(1, "Supervisor name is required"),
  workDescription: z.string().min(1, "Work description is required"),
  divingMode: z.enum(["SCUBA", "Surface Supply", "Wet Bell", "Saturation"]),
  maxDepth: z.string().min(1, "Maximum depth is required"),
  tasks: z.array(taskSchema),
  requiredPPE: z.array(z.string()).min(1, "At least one PPE item must be selected"),
});

type JSAFormValues = z.infer<typeof jsaFormSchema>;

const defaultValues: Partial<JSAFormValues> = {
  date: new Date().toISOString().split('T')[0],
  divingMode: "SCUBA",
  tasks: [
    {
      stepNumber: 1,
      taskDescription: "",
      hazards: "",
      controls: "",
      riskLevel: "Low",
    },
  ],
  requiredPPE: [],
};

const PPE_ITEMS = [
  { id: "diving-helmet", label: "Diving Helmet" },
  { id: "diving-suit", label: "Diving Suit" },
  { id: "umbilical", label: "Umbilical" },
  { id: "safety-harness", label: "Safety Harness" },
  { id: "knife", label: "Diving Knife" },
  { id: "fins", label: "Fins" },
  { id: "gloves", label: "Diving Gloves" },
  { id: "boots", label: "Diving Boots" },
  { id: "weights", label: "Weight Belt" },
  { id: "emergency-gas", label: "Emergency Gas Supply" },
];

export default function NewJSA() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<JSAFormValues>({
    resolver: zodResolver(jsaFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const createJSAMutation = useMutation({
    mutationFn: async (data: JSAFormValues) => {
      const response = await fetch("/api/jsa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create JSA");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jsa"] });
      navigate("/jsa-builder");
    },
  });

  function onSubmit(data: JSAFormValues) {
    createJSAMutation.mutate(data);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">New JSA</h1>
          <HardHat className="h-6 w-6 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Safety Analysis - Diving Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    name="supervisor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supervisor</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="divingMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diving Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select diving mode" />
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

                <FormField
                  control={form.control}
                  name="workDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the diving operation and objectives..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Task Breakdown</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({
                        stepNumber: fields.length + 1,
                        taskDescription: "",
                        hazards: "",
                        controls: "",
                        riskLevel: "Low",
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
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

                          <FormField
                            control={form.control}
                            name={`tasks.${index}.taskDescription`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Description</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`tasks.${index}.hazards`}
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
                            name={`tasks.${index}.controls`}
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
                            name={`tasks.${index}.riskLevel`}
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
                                    <SelectItem value="Critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Required PPE</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {PPE_ITEMS.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="requiredPPE"
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

                <div className="flex justify-end">
                  <Button type="submit">Save JSA</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
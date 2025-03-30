import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCallback, useEffect, useState } from "react";
import { Calculator, Waves, Gauge, Cylinder, Clock, Scale, FileDown } from "lucide-react";
import { gasPlannerCalculator } from "@/lib/gas-planner";
import type { DiveResult, Gas, DiveSegment } from "@/lib/gas-planner";
import { ProfileChart } from "@/components/dive-planner/profile-chart";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const plannerFormSchema = z.object({
  depth: z.enum([
    "6", "9", "12", "15", "18", "21", "24", "27",
    "30", "33", "36", "39", "42", "45", "48", "51"
  ]).transform(Number),
  duration: z.string().transform(Number).pipe(
    z.number().min(1, "Duration must be at least 1 minute").max(720, "Maximum duration is 720 minutes")
  ),
  gasType: z.enum(["air", "nitrox32", "nitrox36"]),
  residualGroup: z.enum([
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
    "U", "V", "W", "X", "Y", "Z"
  ]).optional(),
  tableType: z.enum(["DCIEM", "US_NAVY"]).default("DCIEM"),
  diveDescription: z.string().optional(),
});

const gasSupplyFormSchema = z.object({
  supplyVolume: z.string().transform(Number).pipe(
    z.number().min(0, "Volume must be positive").max(50, "Maximum volume is 50L")
  ),
  supplyPressure: z.string().transform(Number).pipe(
    z.number().min(0, "Pressure must be positive").max(300, "Maximum pressure is 300 bar")
  ),
  consumptionRate: z.string().transform(Number),
  depth: z.string().transform(Number).pipe(
    z.number().min(0, "Depth must be positive").max(50, "Maximum depth is 50m")
  ),
});

type PlannerFormValues = z.infer<typeof plannerFormSchema>;
type GasSupplyFormValues = z.infer<typeof gasSupplyFormSchema>;

const defaultValues: Partial<PlannerFormValues> = {
  depth: undefined,
  duration: undefined,
  gasType: "air",
  residualGroup: undefined,
  tableType: "DCIEM",
  diveDescription: "",
};

const defaultGasValues: Partial<GasSupplyFormValues> = {
  supplyVolume: undefined,
  supplyPressure: undefined,
  consumptionRate: 15,
  depth: 5,
};

const GAS_MIXES: Record<string, Gas> = {
  air: { fO2: 0.21, fHe: 0 },
  nitrox32: { fO2: 0.32, fHe: 0 },
  nitrox36: { fO2: 0.36, fHe: 0 },
};

const RESIDUAL_GROUPS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z"
];

const DIVE_TABLES = [
  { id: "DCIEM", label: "DCIEM Tables" },
  { id: "US_NAVY", label: "US Navy Tables" }
];

const DEPTH_OPTIONS = [
  "6", "9", "12", "15", "18", "21", "24", "27",
  "30", "33", "36", "39", "42", "45", "48", "51"
];

const PRESSURE_PERCENTAGES: Record<number, number> = {
  0: 0,
  5: 0.33,
  10: 0.50,
  15: 0.60,
  20: 0.67,
  25: 0.71,
  30: 0.75,
  35: 0.77,
  40: 0.80,
  45: 0.82,
  50: 0.84,
};

const surfaceIntervalSchema = z.object({
  repetitiveGroup: z.enum([
    "A", "B", "C", "D", "E", "F", "G", "H",
    "I", "J", "K", "L", "M", "N", "O"
  ]),
  timeInterval: z.enum([
    "0:15-0:29", "0:30-0:59", "1:00-1:29", "1:30-1:59",
    "2:00-2:59", "3:00-3:59", "4:00-5:59", "6:00-8:59",
    "9:00-11:59", "12:00-14:59", "15:00-18:00"
  ])
});

const repetitiveDiveSchema = z.object({
  maxDepth: z.enum([
    "9", "12", "15", "18", "21", "24", "27", "30", "33", "36", "39", "42", "45"
  ]),
  repetitiveFactor: z.enum([
    "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2.0"
  ])
});

type SurfaceIntervalFormValues = z.infer<typeof surfaceIntervalSchema>;
type RepetitiveDiveFormValues = z.infer<typeof repetitiveDiveSchema>;

const defaultSurfaceIntervalValues: Partial<SurfaceIntervalFormValues> = {
  repetitiveGroup: undefined,
  timeInterval: undefined
};

const defaultRepetitiveDiveValues: Partial<RepetitiveDiveFormValues> = {
  maxDepth: undefined,
  repetitiveFactor: undefined
};

const TIME_INTERVALS = [
  { label: "0:15 → 0:29", value: "0:15-0:29" },
  { label: "0:30 → 0:59", value: "0:30-0:59" },
  { label: "1:00 → 1:29", value: "1:00-1:29" },
  { label: "1:30 → 1:59", value: "1:30-1:59" },
  { label: "2:00 → 2:59", value: "2:00-2:59" },
  { label: "3:00 → 3:59", value: "3:00-3:59" },
  { label: "4:00 → 5:59", value: "4:00-5:59" },
  { label: "6:00 → 8:59", value: "6:00-8:59" },
  { label: "9:00 → 11:59", value: "9:00-11:59" },
  { label: "12:00 → 14:59", value: "12:00-14:59" },
  { label: "15:00 → 18:00", value: "15:00-18:00" }
];

const REPETITIVE_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];

const REPETITIVE_DIVE_VALUES: Record<string, Record<string, number>> = {
  "9": {
    "1.1": 272, "1.2": 250, "1.3": 230, "1.4": 214, "1.5": 200,
    "1.6": 187, "1.7": 176, "1.8": 166, "1.9": 157, "2.0": 150
  },
  "12": {
    "1.1": 136, "1.2": 125, "1.3": 115, "1.4": 107, "1.5": 100,
    "1.6": 93, "1.7": 88, "1.8": 83, "1.9": 78, "2.0": 75
  },
  "15": {
    "1.1": 60, "1.2": 55, "1.3": 50, "1.4": 45, "1.5": 41,
    "1.6": 38, "1.7": 36, "1.8": 34, "1.9": 32, "2.0": 31
  },
  "18": {
    "1.1": 40, "1.2": 35, "1.3": 31, "1.4": 29, "1.5": 27,
    "1.6": 26, "1.7": 24, "1.8": 23, "1.9": 22, "2.0": 21
  },
  "21": {
    "1.1": 30, "1.2": 25, "1.3": 21, "1.4": 19, "1.5": 18,
    "1.6": 17, "1.7": 16, "1.8": 15, "1.9": 14, "2.0": 13
  },
  "24": {
    "1.1": 20, "1.2": 16, "1.3": 15, "1.4": 14, "1.5": 13,
    "1.6": 12, "1.7": 12, "1.8": 11, "1.9": 11, "2.0": 11
  },
  "27": {
    "1.1": 16, "1.2": 14, "1.3": 12, "1.4": 11, "1.5": 10,
    "1.6": 9, "1.7": 9, "1.8": 8, "1.9": 8, "2.0": 7
  },
  "30": {
    "1.1": 13, "1.2": 11, "1.3": 11, "1.4": 10, "1.5": 9,
    "1.6": 8, "1.7": 7, "1.8": 7, "1.9": 7, "2.0": 6
  },
  "33": {
    "1.1": 10, "1.2": 9, "1.3": 8, "1.4": 7, "1.5": 6,
    "1.6": 6, "1.7": 6, "1.8": 5, "1.9": 5, "2.0": 5
  },
  "36": {
    "1.1": 9, "1.2": 7, "1.3": 6, "1.4": 6, "1.5": 5,
    "1.6": 5, "1.7": 5, "1.8": 5, "1.9": 5, "2.0": 4
  },
  "39": {
    "1.1": 7, "1.2": 6, "1.3": 6, "1.4": 5, "1.5": 5,
    "1.6": 5, "1.7": 5, "1.8": 5, "1.9": 5, "2.0": 4
  },
  "42": {
    "1.1": 6, "1.2": 5, "1.3": 5, "1.4": 4, "1.5": 4,
    "1.6": 4, "1.7": 4, "1.8": 3, "1.9": 3, "2.0": 3
  },
  "45": {
    "1.1": 5, "1.2": 5, "1.3": 4, "1.4": 4, "1.5": 4,
    "1.6": 3, "1.7": 3, "1.8": 3, "1.9": 3, "2.0": 2
  }
};

function calculateSurfaceInterval(group: string, timeInterval: string): number | "NRD" {
  const multipliers: Record<string, Record<string, number | "NRD">> = {
    A: {
      "0:15-0:29": 1.4,
      "0:30-0:59": 1.2,
      "1:00-1:29": 1.1,
      "1:30-1:59": 1.1,
      "2:00-2:59": 1.1,
      "3:00-3:59": 1.1,
      "4:00-5:59": 1.1,
      "6:00-8:59": 1.1,
      "9:00-11:59": 1.0,
      "12:00-14:59": 1.0,
      "15:00-18:00": 1.0,
    },
    B: {
      "0:15-0:29": 1.5,
      "0:30-0:59": 1.3,
      "1:00-1:29": 1.2,
      "1:30-1:59": 1.2,
      "2:00-2:59": 1.2,
      "3:00-3:59": 1.1,
      "4:00-5:59": 1.1,
      "6:00-8:59": 1.1,
      "9:00-11:59": 1.0,
      "12:00-14:59": 1.0,
      "15:00-18:00": 1.0,
    },
    C: {
      "0:15-0:29": 1.6,
      "0:30-0:59": 1.4,
      "1:00-1:29": 1.3,
      "1:30-1:59": 1.2,
      "2:00-2:59": 1.2,
      "3:00-3:59": 1.2,
      "4:00-5:59": 1.1,
      "6:00-8:59": 1.1,
      "9:00-11:59": 1.1,
      "12:00-14:59": 1.0,
      "15:00-18:00": 1.0,
    },
    D: {
      "0:15-0:29": 1.8,
      "0:30-0:59": 1.5,
      "1:00-1:29": 1.3,
      "1:30-1:59": 1.2,
      "2:00-2:59": 1.2,
      "3:00-3:59": 1.2,
      "4:00-5:59": 1.1,
      "6:00-8:59": 1.1,
      "9:00-11:59": 1.1,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.0,
    },
    E: {
      "0:15-0:29": 1.9,
      "0:30-0:59": 1.6,
      "1:00-1:29": 1.5,
      "1:30-1:59": 1.4,
      "2:00-2:59": 1.3,
      "3:00-3:59": 1.2,
      "4:00-5:59": 1.2,
      "6:00-8:59": 1.2,
      "9:00-11:59": 1.1,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    F: {
      "0:15-0:29": 2.0,
      "0:30-0:59": 1.7,
      "1:00-1:29": 1.6,
      "1:30-1:59": 1.5,
      "2:00-2:59": 1.4,
      "3:00-3:59": 1.3,
      "4:00-5:59": 1.3,
      "6:00-8:59": 1.2,
      "9:00-11:59": 1.2,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    G: {
      "0:15-0:29": "NRD",
      "0:30-0:59": 1.9,
      "1:00-1:29": 1.7,
      "1:30-1:59": 1.6,
      "2:00-2:59": 1.5,
      "3:00-3:59": 1.4,
      "4:00-5:59": 1.3,
      "6:00-8:59": 1.2,
      "9:00-11:59": 1.1,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.0,
    },
    H: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": 1.9,
      "2:00-2:59": 1.7,
      "3:00-3:59": 1.6,
      "4:00-5:59": 1.5,
      "6:00-8:59": 1.4,
      "9:00-11:59": 1.3,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    I: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": 2.0,
      "2:00-2:59": 1.8,
      "3:00-3:59": 1.7,
      "4:00-5:59": 1.5,
      "6:00-8:59": 1.4,
      "9:00-11:59": 1.3,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    J: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": "NRD",
      "2:00-2:59": 1.9,
      "3:00-3:59": 1.8,
      "4:00-5:59": 1.6,
      "6:00-8:59": 1.5,
      "9:00-11:59": 1.3,
      "12:00-14:59": 1.2,
      "15:00-18:00": 1.1,
    },
    K: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": 2.0,
      "2:00-2:59": 1.9,
      "3:00-3:59": 1.7,
      "4:00-5:59": 1.5,
      "6:00-8:59": 1.3,
      "9:00-11:59": 1.2,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    L: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": "NRD",
      "2:00-2:59": 2.0,
      "3:00-3:59": 1.7,
      "4:00-5:59": 1.6,
      "6:00-8:59": 1.4,
      "9:00-11:59": 1.2,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    M: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": "NRD",
      "2:00-2:59": "NRD",
      "3:00-3:59": 1.8,
      "4:00-5:59": 1.6,
      "6:00-8:59": 1.4,
      "9:00-11:59": 1.2,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    N: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": "NRD",
      "2:00-2:59": "NRD",
      "3:00-3:59": 1.9,
      "4:00-5:59": 1.7,
      "6:00-8:59": 1.4,
      "9:00-11:59": 1.2,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    },
    O: {
      "0:15-0:29": "NRD",
      "0:30-0:59": "NRD",
      "1:00-1:29": "NRD",
      "1:30-1:59": "NRD",
      "2:00-2:59": "NRD",
      "3:00-3:59": 2.0,
      "4:00-5:59": 1.7,
      "6:00-8:59": 1.4,
      "9:00-11:59": 1.2,
      "12:00-14:59": 1.1,
      "15:00-18:00": 1.1,
    }
  };

  return multipliers[group]?.[timeInterval] || 0;
}


export default function DivePlanner() {
  const [planResult, setPlanResult] = useState<DiveResult | null>(null);
  const [gasSupplyResult, setGasSupplyResult] = useState<{ totalVolume: number; availableTime: number; bottomTime: number; depthPercentage: number } | null>(null);
  const [surfaceIntervalResult, setSurfaceIntervalResult] = useState<number | "NRD" | null>(null);
  const [repetitiveDiveResult, setRepetitiveDiveResult] = useState<number | null>(null);

  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerFormSchema),
    defaultValues,
  });

  const gasSupplyForm = useForm<GasSupplyFormValues>({
    resolver: zodResolver(gasSupplyFormSchema),
    defaultValues: defaultGasValues,
  });

  const surfaceIntervalForm = useForm<SurfaceIntervalFormValues>({
    resolver: zodResolver(surfaceIntervalSchema),
    defaultValues: defaultSurfaceIntervalValues,
  });

  const repetitiveDiveForm = useForm<RepetitiveDiveFormValues>({
    resolver: zodResolver(repetitiveDiveSchema),
    defaultValues: defaultRepetitiveDiveValues,
  });

  function onSubmit(data: PlannerFormValues) {
    const gas = GAS_MIXES[data.gasType];
    const segment: DiveSegment = {
      startDepth: data.depth,
      endDepth: data.depth,
      duration: data.duration,
      gas,
    };

    const result = gasPlannerCalculator.calculateDecompression([segment], {
      lastStopDepth: 3,
      decoStopDistance: 3,
      ascentSpeed6m: 3,
      ascentSpeed50perc: 9,
      descentSpeed: 18,
      problemSolvingDuration: 1,
      maxPpO2: 1.4,
      maxDecoPpO2: 1.6,
      oxygenNarcotic: true,
      tableType: data.tableType,
    });

    setPlanResult(result);
  }

  function onGasSupplySubmit(data: GasSupplyFormValues) {
    const result = gasPlannerCalculator.calculateGasSupply(
      data.supplyVolume,
      data.supplyPressure,
      data.consumptionRate
    );

    const depthPercentage = PRESSURE_PERCENTAGES[data.depth] || 0;
    const bottomTime = result.availableTime * (1 - depthPercentage);

    setGasSupplyResult({
      ...result,
      bottomTime: Math.floor(bottomTime),
      depthPercentage: Math.round(depthPercentage * 100)
    });
  }

  function setTableType(type: "DCIEM" | "US_NAVY") {
    form.setValue("tableType", type);
  }

  const consumptionRates = gasPlannerCalculator.getConsumptionRates();

  function onSurfaceIntervalSubmit(data: SurfaceIntervalFormValues) {
    const result = calculateSurfaceInterval(data.repetitiveGroup, data.timeInterval);
    setSurfaceIntervalResult(result);
  }

  function onRepetitiveDiveSubmit(data: RepetitiveDiveFormValues) {
    const depth = data.maxDepth;
    const factor = data.repetitiveFactor;

    // Look up the value in our table
    const result = REPETITIVE_DIVE_VALUES[depth]?.[factor] ?? null;
    setRepetitiveDiveResult(result);
  }

  const generateReport = async () => {
    const doc = new jsPDF();
    const formData = form.getValues();
    const gasSupplyData = gasSupplyForm.getValues();
    const surfaceIntervalData = surfaceIntervalForm.getValues();
    const repetitiveDiveData = repetitiveDiveForm.getValues();

    // Set up the document
    doc.setFontSize(20);
    doc.text('Dive Planning Report', 20, 20);
    doc.setFontSize(12);

    // Add dive description if provided
    if (formData.diveDescription) {
      doc.text('Dive Description:', 20, 40);
      doc.setFontSize(11);
      doc.text(formData.diveDescription, 20, 50);
      doc.setFontSize(12);
    }

    // Main Dive Plan (adjusted Y positions to account for description)
    doc.text('Dive Plan Details:', 20, formData.diveDescription ? 70 : 40);
    const diveData = [
      ['Maximum Depth', `${formData.depth} MSW`],
      ['Bottom Time', `${formData.duration} minutes`],
      ['Gas Type', formData.gasType],
      ['Table Type', formData.tableType],
      ['Residual Group', formData.residualGroup || 'N/A']
    ];
    (doc as any).autoTable({
      startY: formData.diveDescription ? 75 : 45,
      head: [['Parameter', 'Value']],
      body: diveData,
      theme: 'grid'
    });

    // Gas Supply
    if (gasSupplyResult) {
      doc.text('Gas Supply Details:', 20, (doc as any).lastAutoTable.finalY + 20);
      const gasData = [
        ['Supply Volume', `${gasSupplyData.supplyVolume} L`],
        ['Supply Pressure', `${gasSupplyData.supplyPressure} bar`],
        ['Consumption Rate', `${gasSupplyData.consumptionRate} L/min`],
        ['Depth', `${gasSupplyData.depth} MSW`],
        ['Total Volume', `${gasSupplyResult.totalVolume}L`],
        ['Available Time', `${gasSupplyResult.availableTime} min`],
        ['Volume Used at Depth', `${gasSupplyResult.depthPercentage}%`],
        ['Bottom Time', `${gasSupplyResult.bottomTime} min`]
      ];
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 25,
        head: [['Parameter', 'Value']],
        body: gasData,
        theme: 'grid'
      });
    }

    // Surface Interval Calculator Results
    if (surfaceIntervalResult !== null) {
      doc.text('Surface Interval Results:', 20, (doc as any).lastAutoTable.finalY + 20);
      const surfaceIntervalData = [
        ['Repetitive Group', surfaceIntervalForm.getValues().repetitiveGroup],
        ['Time Interval', surfaceIntervalForm.getValues().timeInterval],
        ['Result', surfaceIntervalResult === "NRD" ? "NRD" : `${surfaceIntervalResult.toFixed(1)}`]
      ];
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 25,
        head: [['Parameter', 'Value']],
        body: surfaceIntervalData,
        theme: 'grid'
      });
    }

    // Repetitive Dive Planner Results
    if (repetitiveDiveResult !== null) {
      doc.text('Repetitive Dive Results:', 20, (doc as any).lastAutoTable.finalY + 20);
      const repetitiveDiveData = [
        ['Maximum Depth', `${repetitiveDiveForm.getValues().maxDepth} MSW`],
        ['Repetitive Factor', repetitiveDiveForm.getValues().repetitiveFactor],
        ['Allowed Bottom Time', `${repetitiveDiveResult} minutes`]
      ];
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 25,
        head: [['Parameter', 'Value']],
        body: repetitiveDiveData,
        theme: 'grid'
      });
    }

    // Main Dive Results
    if (planResult) {
      doc.text('Dive Results:', 20, (doc as any).lastAutoTable.finalY + 20);
      const resultData = [
        ['Total Runtime', `${planResult.plan.totalTime} minutes`],
        ['Maximum Depth', `${planResult.plan.maxDepth}m`],
        ['Decompression Stops', planResult.decompression.length > 0 ? 'Required' : 'Not Required']
      ];

      // Add decompression stops if any
      if (planResult.decompression.length > 0) {
        planResult.decompression.forEach((stop, index) => {
          resultData.push([`Stop ${index + 1}`, `${stop.depth}m for ${stop.duration} minutes`]);
        });
      }

      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 25,
        head: [['Parameter', 'Value']],
        body: resultData,
        theme: 'grid'
      });

      // Add Profile Chart
      try {
        // Wait for a short time to ensure chart is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        const chartElement = document.querySelector('svg.recharts-surface');
        if (chartElement) {
          // Convert SVG to canvas
          const svgData = new XMLSerializer().serializeToString(chartElement);
          const img = new Image();
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const canvas = document.createElement('canvas');
          canvas.width = chartElement.clientWidth;
          canvas.height = chartElement.clientHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);

          doc.addPage();
          doc.text('Dive Profile Chart:', 20, 20);
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 20, 30, 170, 100);
        }
      } catch (error) {
        console.error('Failed to add chart to PDF:', error);
      }
    }

    // Save the PDF
    doc.save('dive-plan-report.pdf');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Dive Planner</h1>
            <Calculator className="h-6 w-6 text-muted-foreground" />
          </div>
          <Button onClick={generateReport} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Generate Report
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan Your Dive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-sm font-medium mb-2">Select Dive Tables</div>
                <div className="flex gap-2">
                  {DIVE_TABLES.map((table) => (
                    <Button
                      key={table.id}
                      variant={form.watch("tableType") === table.id ? "default" : "outline"}
                      onClick={() => setTableType(table.id as "DCIEM" | "US_NAVY")}
                      className="flex-1"
                    >
                      {table.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="depth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Depth (MSW)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select depth" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPTH_OPTIONS.map((depth) => (
                              <SelectItem key={depth} value={depth}>
                                {depth} MSW
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Select the maximum depth of your planned dive.</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bottom Time (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter duration" {...field} />
                        </FormControl>
                        <FormDescription>Enter the planned bottom time in minutes.</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gasType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breathing Gas</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gas mix" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="air">Air</SelectItem>
                            <SelectItem value="nitrox32">Nitrox 32</SelectItem>
                            <SelectItem value="nitrox36">Nitrox 36</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="residualGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residual Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select residual group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESIDUAL_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>
                                Group {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Select your starting residual group if this is a repetitive dive.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="diveDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter dive description, objectives, and any special considerations..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add any important details about the dive plan that should appear at the top of the report.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Calculate Plan</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gas Supply Calculator</CardTitle>
                <Cylinder className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Form {...gasSupplyForm}>
                <form onSubmit={gasSupplyForm.handleSubmit(onGasSupplySubmit)} className="space-y-4">
                  <FormField
                    control={gasSupplyForm.control}
                    name="depth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Depth (MSW)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select depth" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPTH_OPTIONS.map((depth) => (
                              <SelectItem key={depth} value={depth}>
                                {depth} MSW
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Select the planned dive depth</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={gasSupplyForm.control}
                    name="supplyVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supply Volume (liters)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter volume" {...field} />
                        </FormControl>
                        <FormDescription>Tank volume in liters</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gasSupplyForm.control}
                    name="supplyPressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supply Pressure (bar)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter pressure" {...field} />
                        </FormControl>
                        <FormDescription>Tank pressure in bar</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gasSupplyForm.control}
                    name="consumptionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumption Rate (L/min)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select consumption rate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {consumptionRates.map((rate) => (
                              <SelectItem key={rate} value={rate.toString()}>
                                {rate} L/min
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">Calculate Gas Supply</Button>

                  {gasSupplyResult && (
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Volume:</span>
                          <span className="text-lg font-semibold">{gasSupplyResult.totalVolume}L</span>
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Max Available Time:</span>
                          <span className="text-lg font-semibold">{gasSupplyResult.availableTime} min</span>
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Volume Used at Depth:</span>
                          <span className="textlg font-semibold">{gasSupplyResult.depthPercentage}%</span>
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Bottom Time:</span>
                          <span className="text-lg font-semibold">{gasSupplyResult.bottomTime} min</span>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Surface Interval Calculator</CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Form {...surfaceIntervalForm}>
                <form onSubmit={surfaceIntervalForm.handleSubmit(onSurfaceIntervalSubmit)} className="space-y-4">
                  <FormField
                    control={surfaceIntervalForm.control}
                    name="repetitiveGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repetitive Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REPETITIVE_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>
                                Group {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={surfaceIntervalForm.control}
                    name="timeInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surface Interval</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time interval" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_INTERVALS.map((interval) => (
                              <SelectItem key={interval.value} value={interval.value}>
                                {interval.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">Calculate</Button>

                  {surfaceIntervalResult !== null && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Result:</span>
                        <span className="text-lg font-semibold">
                          {surfaceIntervalResult === "NRD" ? "NRD" : surfaceIntervalResult.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Repetitive Dive Planner</CardTitle>
                <Scale className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Form {...repetitiveDiveForm}>
                <form onSubmit={repetitiveDiveForm.handleSubmit(onRepetitiveDiveSubmit)} className="space-y-4">
                  <FormField
                    control={repetitiveDiveForm.control}
                    name="maxDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Depth (MSW)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select depth" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["9", "12", "15", "18", "21", "24", "27", "30", "33", "36", "39", "42", "45"].map((depth) => (
                              <SelectItem key={depth} value={depth}>
                                {depth} MSW
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={repetitiveDiveForm.control}
                    name="repetitiveFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repetitive Factor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select factor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2.0"].map((factor) => (
                              <SelectItem key={factor} value={factor}>
                                {factor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">Calculate</Button>

                  {repetitiveDiveResult !== null && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Result:</span>
                        <span className="text-lg font-semibold">
                          {repetitiveDiveResult}
                        </span>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Dive Plan Results</CardTitle>
            </CardHeader>
            <CardContent>
              {planResult ? (
                <div className="space-y-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Using {form.watch("tableType").replace("_", " ")} Tables
                  </div>
                  <ProfileChart
                    segments={planResult.plan.segments}
                    decompression={planResult.decompression}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Runtime</p>
                      <p className="text-2xl font-bold">{planResult.plan.totalTime} min</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Max Depth</p>
                      <p className="text-2xl font-bold">{planResult.plan.maxDepth}m</p>
                    </div>
                  </div>

                  {planResult.decompression.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Decompression Stops</h3>
                      <div className="space-y-2">
                        {planResult.decompression.map((stop: DiveSegment, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                              <Waves className="h-4 w-4" />
                              <span>{stop.startDepth}m</span>
                            </div>
                            <span>{stop.duration} min</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">CNS</p>
                      <p className="text-2xl font-bold">{Math.round(planResult.cns)}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">OTU</p>
                      <p className="text-2xl font-bold">{Math.round(planResult.otu)}</p>
                    </div>
                  </div>
                  {planResult?.tableGroup && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Residual Group</p>
                      <p className="text-2xl font-bold">Group {planResult.tableGroup}</p>
                      {planResult.tableGroup === 'NRG' && (
                        <p className="text-sm text-red-500 font-medium mt-1">
                          Exceptional exposure for emergencies only
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter dive parameters to see the plan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dive Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="diveDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter dive description, objectives, and any special considerations..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Add any important details about the dive plan that should appear at the top of the report.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
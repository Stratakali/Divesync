export interface Gas {
  fO2: number;  // Oxygen fraction
  fHe: number;  // Helium fraction
  mod?: number; // Maximum operating depth
}

export interface DiveSegment {
  startDepth: number;
  endDepth: number;
  duration: number;
  gas: Gas;
}

export interface DivePlan {
  segments: DiveSegment[];
  totalTime: number;
  maxDepth: number;
  gases: Gas[];
}

export interface PlannerOptions {
  lastStopDepth: number;
  decoStopDistance: number;
  ascentSpeed6m: number;
  ascentSpeed50perc: number;
  descentSpeed: number;
  problemSolvingDuration: number;
  maxPpO2: number;
  maxDecoPpO2: number;
  oxygenNarcotic: boolean;
  tableType: "DCIEM" | "US_NAVY" | "RECREATIONAL";
}

export interface DiveTableResult {
  residualGroup: string;
  decompression: number;
  decompressionStops?: DiveSegment[];
}

export interface DiveResult {
  plan: DivePlan;
  decompression: DiveSegment[];
  cns: number;
  otu: number;
  tableGroup?: string;
}
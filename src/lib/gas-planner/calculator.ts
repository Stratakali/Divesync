import type { DiveSegment, DivePlan, PlannerOptions, DiveResult, Gas } from './types';

export interface GasSupplyResult {
  totalVolume: number;  // in liters
  availableTime: number;  // in minutes
}

export interface DiveTableResult {
  residualGroup: string;
  decompression: number;
  decompressionStops?: { startDepth: number; endDepth: number; duration: number; gas: Gas }[]
}

export class GasSupplyCalculator {
  calculateGasSupply(supplyVolume: number, supplyPressure: number, consumptionRate: number): GasSupplyResult {
    const totalVolume = supplyVolume * supplyPressure;
    const availableTime = Math.floor(totalVolume / consumptionRate);

    return {
      totalVolume,
      availableTime
    };
  }

  getConsumptionRates(): number[] {
    // Returns consumption rates in 10L increments from 10 to 120 LPM
    const rates = [];
    for (let rate = 10; rate <= 120; rate += 10) {
      rates.push(rate);
    }
    return rates;
  }
}

export class GasPlannerCalculator {
  private readonly surfacePressure = 1.01325; // bar
  private readonly gasSupplyCalculator = new GasSupplyCalculator();

  private readonly DCIEM_48M_TABLE: Record<number, { 
    group: string; 
    decoStop15m?: number;
    decoStop12m?: number;
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    6: { group: 'B', totalDeco: 3 },
    10: { group: 'D', totalDeco: 11 },
    15: { group: 'G', totalDeco: 20, decoStop9m: 4, decoStop6m: 6 },
    20: { group: 'H', totalDeco: 30, decoStop9m: 8, decoStop6m: 8 },
    25: { group: 'K', totalDeco: 49, decoStop12m: 6, decoStop9m: 6, decoStop6m: 8 },
    30: { group: 'L', totalDeco: 64, decoStop12m: 5, decoStop9m: 7, decoStop6m: 10 },
    35: { group: 'N', totalDeco: 80, decoStop12m: 5, decoStop9m: 8, decoStop6m: 13 },
    40: { group: 'NRG', totalDeco: 99, decoStop12m: 6, decoStop9m: 8, decoStop6m: 20 },
    45: { group: 'NRG', totalDeco: 121, decoStop15m: 3, decoStop12m: 5, decoStop9m: 9, decoStop6m: 26 },
    50: { group: 'NRG', totalDeco: 146, decoStop15m: 4, decoStop12m: 5, decoStop9m: 9, decoStop6m: 33 },
    55: { group: 'NRG', totalDeco: 173, decoStop15m: 5, decoStop12m: 5, decoStop9m: 13, decoStop6m: 38 },
    60: { group: 'NRG', totalDeco: 201, decoStop15m: 6, decoStop12m: 5, decoStop9m: 17, decoStop6m: 43 },
    65: { group: 'NRG', totalDeco: 227, decoStop15m: 7, decoStop12m: 5, decoStop9m: 22, decoStop6m: 50 },
    70: { group: 'NRG', totalDeco: 251, decoStop15m: 7, decoStop12m: 6, decoStop9m: 26, decoStop6m: 58 }
  };

  private readonly DCIEM_6M_TABLE: Record<number, string> = {
    30: 'A',
    60: 'B',
    90: 'C',
    120: 'D',
    150: 'E',
    180: 'F',
    240: 'G',
    300: 'H',
    360: 'I',
    420: 'J',
    480: 'K',
    600: 'L',
    720: 'M'
  };

  private readonly DCIEM_9M_TABLE: Record<number, { group: string; decoStop?: number; totalDeco: number }> = {
    30: { group: 'A', totalDeco: 1 },
    60: { group: 'C', totalDeco: 1 },
    90: { group: 'D', totalDeco: 1 },
    120: { group: 'F', totalDeco: 1 },
    150: { group: 'G', totalDeco: 1 },
    180: { group: 'H', totalDeco: 1 },
    240: { group: 'J', totalDeco: 1 },
    270: { group: 'K', totalDeco: 1 },
    300: { group: 'L', totalDeco: 1 },
    330: { group: 'M', decoStop: 3, totalDeco: 3 },
    360: { group: 'N', decoStop: 5, totalDeco: 5 },
    400: { group: 'O', decoStop: 7, totalDeco: 7 },
    420: { group: 'P', totalDeco: 10 },
    450: { group: 'Q', totalDeco: 15 },
    480: { group: 'R', totalDeco: 20 }
  };

  private readonly DCIEM_12M_TABLE: Record<number, { group: string; totalDeco: number }> = {
    20: { group: 'A', totalDeco: 1 },
    30: { group: 'B', totalDeco: 1 },
    60: { group: 'C', totalDeco: 1 },
    90: { group: 'D', totalDeco: 1 },
    120: { group: 'F', totalDeco: 1 },
    150: { group: 'G', totalDeco: 1 },
    180: { group: 'H', totalDeco: 1 },
    210: { group: 'J', totalDeco: 1 },
    240: { group: 'M', totalDeco: 5 },
    270: { group: 'N', totalDeco: 15 },
    300: { group: 'O', totalDeco: 25 },
    330: { group: 'P', totalDeco: 39 },
    360: { group: 'Q', totalDeco: 53 }
  };

  private readonly DCIEM_15M_TABLE: Record<number, { group: string; totalDeco: number }> = {
    10: { group: 'A', totalDeco: 1 },
    20: { group: 'B', totalDeco: 1 },
    30: { group: 'C', totalDeco: 1 },
    40: { group: 'D', totalDeco: 1 },
    50: { group: 'E', totalDeco: 1 },
    60: { group: 'F', totalDeco: 1 },
    75: { group: 'G', totalDeco: 1 },
    100: { group: 'I', totalDeco: 5 },
    120: { group: 'K', totalDeco: 10 },
    125: { group: 'K', totalDeco: 13 },
    130: { group: 'L', totalDeco: 16 },
    140: { group: 'M', totalDeco: 21 },
    150: { group: 'NRG', totalDeco: 26 },
    160: { group: 'NRG', totalDeco: 31 },
    170: { group: 'NRG', totalDeco: 35 },
    180: { group: 'NRG', totalDeco: 40 },
    200: { group: 'NRG', totalDeco: 50 },
    220: { group: 'NRG', totalDeco: 59 },
    240: { group: 'NRG', totalDeco: 70 },
    260: { group: 'NRG', totalDeco: 81 },
    280: { group: 'NRG', totalDeco: 91 }
  };

  private readonly DCIEM_18M_TABLE: Record<number, { group: string; decoStop6m?: number; totalDeco: number }> = {
    10: { group: 'A', totalDeco: 1 },
    20: { group: 'D', totalDeco: 1 },
    30: { group: 'E', totalDeco: 1 },
    40: { group: 'F', totalDeco: 1 },
    50: { group: 'G', totalDeco: 1 },
    60: { group: 'I', totalDeco: 5, decoStop6m: 5 },
    80: { group: 'J', totalDeco: 10, decoStop6m: 10 },
    90: { group: 'K', totalDeco: 16, decoStop6m: 16 },
    100: { group: 'L', totalDeco: 24, decoStop6m: 24 },
    110: { group: 'M', totalDeco: 30, decoStop6m: 30 },
    120: { group: 'NRG', totalDeco: 36, decoStop6m: 36 },
    130: { group: 'NRG', totalDeco: 42, decoStop6m: 2 },
    140: { group: 'NRG', totalDeco: 48, decoStop6m: 2 },
    150: { group: 'NRG', totalDeco: 55, decoStop6m: 3 },
    160: { group: 'NRG', totalDeco: 62, decoStop6m: 3 },
    170: { group: 'NRG', totalDeco: 69, decoStop6m: 4 },
    180: { group: 'NRG', totalDeco: 77, decoStop6m: 4 },
    190: { group: 'NRG', totalDeco: 85, decoStop6m: 5 },
    200: { group: 'NRG', totalDeco: 94, decoStop6m: 7 },
    210: { group: 'NRG', totalDeco: 104, decoStop6m: 13 },
    220: { group: 'NRG', totalDeco: 114, decoStop6m: 17 },
    230: { group: 'NRG', totalDeco: 124, decoStop6m: 21 },
    240: { group: 'NRG', totalDeco: 133, decoStop6m: 24 }
  };

  private readonly DCIEM_21M_TABLE: Record<number, { group: string; decoStop6m?: number; totalDeco: number }> = {
    10: { group: 'A', totalDeco: 0 },
    15: { group: 'B', totalDeco: 1 },
    20: { group: 'C', totalDeco: 1 },
    25: { group: 'D', totalDeco: 1 },
    30: { group: 'D', totalDeco: 1 },
    35: { group: 'E', totalDeco: 1 },
    40: { group: 'F', totalDeco: 5, decoStop6m: 5 },
    50: { group: 'G', totalDeco: 10, decoStop6m: 10 },
    60: { group: 'H', totalDeco: 12, decoStop6m: 12 },
    70: { group: 'J', totalDeco: 20, decoStop6m: 17 },
    80: { group: 'K', totalDeco: 29, decoStop6m: 3 },
    90: { group: 'M', totalDeco: 37, decoStop6m: 4 },
    100: { group: 'N', totalDeco: 45, decoStop6m: 5 },
    110: { group: 'NRG', totalDeco: 53, decoStop6m: 6 },
    120: { group: 'NRG', totalDeco: 61, decoStop6m: 7 },
    130: { group: 'NRG', totalDeco: 70, decoStop6m: 8 },
    140: { group: 'NRG', totalDeco: 80, decoStop6m: 9 },
    150: { group: 'NRG', totalDeco: 92, decoStop6m: 15 },
    160: { group: 'NRG', totalDeco: 105, decoStop6m: 20 },
    170: { group: 'NRG', totalDeco: 118, decoStop6m: 25 },
    180: { group: 'NRG', totalDeco: 130, decoStop6m: 29 },
    190: { group: 'NRG', totalDeco: 143, decoStop6m: 34 },
    200: { group: 'NRG', totalDeco: 155, decoStop6m: 38 }
  };

  private readonly DCIEM_24M_TABLE: Record<number, { 
    group: string; 
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    10: { group: 'A', totalDeco: 2 },
    15: { group: 'C', totalDeco: 2 },
    20: { group: 'E', totalDeco: 2 },
    25: { group: 'F', totalDeco: 2 },
    30: { group: 'G', totalDeco: 5 },
    40: { group: 'H', totalDeco: 11, decoStop6m: 5 },
    50: { group: 'I', totalDeco: 15, decoStop6m: 4, decoStop9m: 11 },
    55: { group: 'J', totalDeco: 20, decoStop6m: 5, decoStop9m: 15 },
    60: { group: 'K', totalDeco: 27, decoStop6m: 6, decoStop9m: 21 },
    65: { group: 'L', totalDeco: 32, decoStop6m: 7, decoStop9m: 25 },
    70: { group: 'M', totalDeco: 37, decoStop6m: 7, decoStop9m: 30 },
    75: { group: 'N', totalDeco: 42, decoStop6m: 8, decoStop9m: 34 },
    80: { group: 'NRG', totalDeco: 46, decoStop6m: 9, decoStop9m: 37 },
    85: { group: 'NRG', totalDeco: 51, decoStop6m: 9, decoStop9m: 42 },
    90: { group: 'NRG', totalDeco: 56, decoStop6m: 10, decoStop9m: 46 },
    95: { group: 'NRG', totalDeco: 61, decoStop6m: 11, decoStop9m: 50 },
    100: { group: 'NRG', totalDeco: 66, decoStop6m: 11, decoStop9m: 55 },
    110: { group: 'NRG', totalDeco: 78, decoStop6m: 12, decoStop9m: 64, decoStop12m: 2 },
    120: { group: 'NRG', totalDeco: 93, decoStop6m: 18, decoStop9m: 72, decoStop12m: 3 },
    130: { group: 'NRG', totalDeco: 109, decoStop6m: 23, decoStop9m: 82, decoStop12m: 4 },
    140: { group: 'NRG', totalDeco: 125, decoStop6m: 28, decoStop9m: 93, decoStop12m: 4 },
    150: { group: 'NRG', totalDeco: 142, decoStop6m: 33, decoStop9m: 104, decoStop12m: 5 },
    160: { group: 'NRG', totalDeco: 158, decoStop6m: 39, decoStop9m: 114, decoStop12m: 5 }
  };

  private readonly DCIEM_27M_TABLE: Record<number, { 
    group: string; 
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    5: { group: 'A', totalDeco: 2 },
    10: { group: 'B', totalDeco: 2 },
    15: { group: 'C', totalDeco: 2 },
    20: { group: 'D', totalDeco: 2 },
    25: { group: 'E', totalDeco: 7 },
    30: { group: 'F', totalDeco: 11, decoStop6m: 2 },
    40: { group: 'H', totalDeco: 16, decoStop6m: 6 },
    45: { group: 'I', totalDeco: 21, decoStop6m: 7 },
    50: { group: 'J', totalDeco: 28, decoStop6m: 8 },
    55: { group: 'K', totalDeco: 35, decoStop6m: 9 },
    60: { group: 'L', totalDeco: 41, decoStop9m: 2, decoStop6m: 8 },
    65: { group: 'NRG', totalDeco: 47, decoStop9m: 3, decoStop6m: 8 },
    70: { group: 'NRG', totalDeco: 52, decoStop9m: 3, decoStop6m: 9 },
    75: { group: 'NRG', totalDeco: 58, decoStop9m: 4, decoStop6m: 9 },
    80: { group: 'NRG', totalDeco: 65, decoStop9m: 4, decoStop6m: 10 },
    85: { group: 'NRG', totalDeco: 71, decoStop9m: 5, decoStop6m: 10 },
    90: { group: 'NRG', totalDeco: 79, decoStop9m: 5, decoStop6m: 14 },
    95: { group: 'NRG', totalDeco: 87, decoStop9m: 6, decoStop6m: 17 },
    100: { group: 'NRG', totalDeco: 96, decoStop9m: 6, decoStop6m: 20 },
    110: { group: 'NRG', totalDeco: 115, decoStop9m: 7, decoStop6m: 26 },
    120: { group: 'NRG', totalDeco: 134, decoStop9m: 8, decoStop6m: 31 }
  };

  private readonly DCIEM_30M_TABLE: Record<number, { 
    group: string; 
    decoStop12m?: number;
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    5: { group: 'A', totalDeco: 2 },
    10: { group: 'B', totalDeco: 2 },
    15: { group: 'C', totalDeco: 2 },
    20: { group: 'E', totalDeco: 8 },
    25: { group: 'F', totalDeco: 12, decoStop6m: 3 },
    30: { group: 'G', totalDeco: 15, decoStop6m: 5 },
    35: { group: 'H', totalDeco: 18, decoStop6m: 7 },
    40: { group: 'I', totalDeco: 25, decoStop6m: 9 },
    45: { group: 'J', totalDeco: 34, decoStop9m: 3, decoStop6m: 8 },
    50: { group: 'K', totalDeco: 41, decoStop9m: 4, decoStop6m: 8 },
    55: { group: 'NRG', totalDeco: 48, decoStop9m: 5, decoStop6m: 9 },
    60: { group: 'NRG', totalDeco: 55, decoStop9m: 6, decoStop6m: 9 },
    65: { group: 'NRG', totalDeco: 62, decoStop9m: 6, decoStop6m: 10 },
    70: { group: 'NRG', totalDeco: 69, decoStop9m: 7, decoStop6m: 10 },
    75: { group: 'NRG', totalDeco: 78, decoStop9m: 8, decoStop6m: 14 },
    80: { group: 'NRG', totalDeco: 87, decoStop9m: 8, decoStop6m: 18 },
    85: { group: 'NRG', totalDeco: 97, decoStop9m: 9, decoStop6m: 21 },
    90: { group: 'NRG', totalDeco: 107, decoStop12m: 2, decoStop9m: 8, decoStop6m: 24 },
    95: { group: 'NRG', totalDeco: 120, decoStop12m: 3, decoStop9m: 8, decoStop6m: 27 },
    100: { group: 'NRG', totalDeco: 132, decoStop12m: 3, decoStop9m: 8, decoStop6m: 31 },
    105: { group: 'NRG', totalDeco: 144, decoStop12m: 3, decoStop9m: 9, decoStop6m: 34 },
    110: { group: 'NRG', totalDeco: 158, decoStop12m: 4, decoStop9m: 10, decoStop6m: 38 }
  };
  
    private readonly DCIEM_33M_TABLE: Record<number, { 
    group: string; 
    decoStop12m?: number;
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    5: { group: 'A', totalDeco: 2 },
    10: { group: 'B', totalDeco: 2 },
      12: { group: 'C', totalDeco: 2 },
    15: { group: 'D', totalDeco: 5 },
    20: { group: 'F', totalDeco: 12, decoStop6m: 3 },
    25: { group: 'G', totalDeco: 16, decoStop6m: 6 },
    30: { group: 'H', totalDeco: 19, decoStop6m: 9 },
    35: { group: 'I', totalDeco: 27, decoStop9m: 3, decoStop6m: 8 },
    40: { group: 'J', totalDeco: 37, decoStop9m: 5, decoStop6m: 8 },
    45: { group: 'K', totalDeco: 46, decoStop9m: 6, decoStop6m: 9 },
    50: { group: 'M', totalDeco: 54, decoStop9m: 7, decoStop6m: 9 },
    55: { group: 'N', totalDeco: 62, decoStop9m: 8, decoStop6m: 10 },
      60: { group: 'NRG', totalDeco: 70, decoStop12m: 2, decoStop9m: 7, decoStop6m: 10 },
      65: { group: 'NRG', totalDeco: 79, decoStop12m: 3, decoStop9m: 7, decoStop6m: 12 },
      70: { group: 'NRG', totalDeco: 92, decoStop12m: 4, decoStop9m: 7, decoStop6m: 19 },
      75: { group: 'NRG', totalDeco: 103, decoStop12m: 4, decoStop9m: 8, decoStop6m: 23 },
      80: { group: 'NRG', totalDeco: 116, decoStop12m: 5, decoStop9m: 8, decoStop6m: 26 },
      85: { group: 'NRG', totalDeco: 130, decoStop12m: 5, decoStop9m: 9, decoStop6m: 30 },
      90: { group: 'NRG', totalDeco: 144, decoStop12m: 6, decoStop9m: 9, decoStop6m: 34 },
      95: { group: 'NRG', totalDeco: 158, decoStop12m: 6, decoStop9m: 9, decoStop6m: 38 },
      100: { group: 'NRG', totalDeco: 172, decoStop12m: 7, decoStop9m: 9, decoStop6m: 42 },
       105: { group: 'NRG', totalDeco: 187, decoStop12m: 7, decoStop9m: 12, decoStop6m: 45 },
      110: { group: 'NRG', totalDeco: 201, decoStop12m: 8, decoStop9m: 15, decoStop6m: 48 }
  };

    private readonly DCIEM_36M_TABLE: Record<number, { 
    group: string; 
    decoStop15m?: number;
    decoStop12m?: number;
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    5: { group: 'A', totalDeco: 2 },
    10: { group: 'C', totalDeco: 2 },
    15: { group: 'D', totalDeco: 10 },
    20: { group: 'F', totalDeco: 15, decoStop6m: 5 },
    25: { group: 'G', totalDeco: 19, decoStop6m: 9 },
    30: { group: 'I', totalDeco: 26, decoStop9m: 4, decoStop6m: 8 },
    35: { group: 'J', totalDeco: 38, decoStop9m: 6, decoStop6m: 8 },
    40: { group: 'K', totalDeco: 48, decoStop9m: 8, decoStop6m: 8 },
    45: { group: 'M', totalDeco: 57, decoStop12m: 3, decoStop9m: 6, decoStop6m: 10 },
    50: { group: 'N', totalDeco: 68, decoStop12m: 4, decoStop9m: 7, decoStop6m: 12 },
    55: { group: 'NRG', totalDeco: 78, decoStop12m: 5, decoStop9m: 7, decoStop6m: 13 },
    60: { group: 'NRG', totalDeco: 90, decoStop12m: 6, decoStop9m: 7, decoStop6m: 18 },
    65: { group: 'NRG', totalDeco: 102, decoStop12m: 6, decoStop9m: 8, decoStop6m: 22 },
    70: { group: 'NRG', totalDeco: 116, decoStop12m: 7, decoStop9m: 8, decoStop6m: 27 },
    75: { group: 'NRG', totalDeco: 133, decoStop12m: 8, decoStop9m: 8, decoStop6m: 31 },
    80: { group: 'NRG', totalDeco: 149, decoStop15m: 2, decoStop12m: 6, decoStop9m: 9, decoStop6m: 35 },
    85: { group: 'NRG', totalDeco: 166, decoStop15m: 3, decoStop12m: 6, decoStop9m: 10, decoStop6m: 40 },
    90: { group: 'NRG', totalDeco: 183, decoStop15m: 3, decoStop12m: 7, decoStop9m: 13, decoStop6m: 42 },
    95: { group: 'NRG', totalDeco: 200, decoStop15m: 4, decoStop12m: 6, decoStop9m: 16, decoStop6m: 46 },
    100: { group: 'NRG', totalDeco: 216, decoStop15m: 4, decoStop12m: 7, decoStop9m: 19, decoStop6m: 50 }
  };
  
    private readonly DCIEM_39M_TABLE: Record<number, { 
    group: string; 
    decoStop15m?: number;
    decoStop12m?: number;
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    5: { group: 'A', totalDeco: 2 },
    8: { group: 'B', totalDeco: 2 },
      10: { group: 'C', totalDeco: 2 },
    15: { group: 'E', totalDeco: 12, decoStop6m: 4 },
    20: { group: 'G', totalDeco: 18, decoStop6m: 8 },
    25: { group: 'H', totalDeco: 23, decoStop9m: 5, decoStop6m: 7 },
    30: { group: 'J', totalDeco: 37, decoStop9m: 7, decoStop6m: 8 },
    35: { group: 'K', totalDeco: 48, decoStop12m: 3, decoStop9m: 6, decoStop6m: 9 },
    40: { group: 'M', totalDeco: 59, decoStop12m: 4, decoStop9m: 7, decoStop6m: 9 },
    45: { group: 'N', totalDeco: 70, decoStop12m: 5, decoStop9m: 7, decoStop6m: 12 },
    50: { group: 'NRG', totalDeco: 82, decoStop12m: 7, decoStop9m: 7, decoStop6m: 15 },
     55: { group: 'NRG', totalDeco: 97, decoStop15m: 2, decoStop12m: 6, decoStop9m: 8, decoStop6m: 20 },
      60: { group: 'NRG', totalDeco: 112, decoStop15m: 3, decoStop12m: 6, decoStop9m: 8, decoStop6m: 25 },
      65: { group: 'NRG', totalDeco: 127, decoStop15m: 4, decoStop12m: 6, decoStop9m: 8, decoStop6m: 30 },
      70: { group: 'NRG', totalDeco: 148, decoStop15m: 4, decoStop12m: 7, decoStop9m: 9, decoStop6m: 34 },
      75: { group: 'NRG', totalDeco: 167, decoStop15m: 5, decoStop12m: 6, decoStop9m: 11, decoStop6m: 39 },
      80: { group: 'NRG', totalDeco: 186, decoStop15m: 5, decoStop12m: 7, decoStop9m: 14, decoStop6m: 42 },
      85: { group: 'NRG', totalDeco: 206, decoStop15m: 6, decoStop12m: 7, decoStop9m: 17, decoStop6m: 47 },
      90: { group: 'NRG', totalDeco: 224, decoStop15m: 6, decoStop12m: 8, decoStop9m: 20, decoStop6m: 52 }
  };

  private readonly DCIEM_42M_TABLE: Record<number, { 
    group: string; 
    decoStop15m?: number;
    decoStop12m?: number;
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    7: { group: 'B', totalDeco: 2 },
    10: { group: 'E', totalDeco: 7 },
    15: { group: 'F', totalDeco: 15, decoStop6m: 6 },
    20: { group: 'G', totalDeco: 21, decoStop9m: 4, decoStop6m: 7 },
    25: { group: 'I', totalDeco: 32, decoStop9m: 7, decoStop6m: 8 },
    30: { group: 'K', totalDeco: 46, decoStop12m: 4, decoStop9m: 6, decoStop6m: 8 },
    35: { group: 'L', totalDeco: 58, decoStop12m: 5, decoStop9m: 7, decoStop6m: 9 },
    40: { group: 'N', totalDeco: 70, decoStop12m: 7, decoStop9m: 7, decoStop6m: 10 },
    45: { group: 'O', totalDeco: 85, decoStop15m: 3, decoStop12m: 5, decoStop9m: 8, decoStop6m: 16 },
    50: { group: 'NRG', totalDeco: 101, decoStop15m: 4, decoStop12m: 6, decoStop9m: 8, decoStop6m: 21 },
    55: { group: 'NRG', totalDeco: 119, decoStop15m: 5, decoStop12m: 6, decoStop9m: 8, decoStop6m: 27 },
    60: { group: 'NRG', totalDeco: 139, decoStop15m: 6, decoStop12m: 6, decoStop9m: 9, decoStop6m: 32 },
    65: { group: 'NRG', totalDeco: 159, decoStop15m: 6, decoStop12m: 7, decoStop9m: 10, decoStop6m: 37 },
    70: { group: 'NRG', totalDeco: 182, decoStop15m: 3, decoStop12m: 5, decoStop9m: 14, decoStop6m: 40 },
    75: { group: 'NRG', totalDeco: 204, decoStop15m: 3, decoStop12m: 5, decoStop9m: 18, decoStop6m: 45 },
    80: { group: 'NRG', totalDeco: 225, decoStop15m: 3, decoStop12m: 6, decoStop9m: 21, decoStop6m: 51 },
     85: { group: 'NRG', totalDeco: 244, decoStop15m: 3, decoStop12m: 5, decoStop9m: 25, decoStop6m: 57 },
    90: { group: 'NRG', totalDeco: 263, decoStop15m: 4, decoStop12m: 6, decoStop9m: 28, decoStop6m: 65 }
  };
    private readonly DCIEM_45M_TABLE: Record<number, { 
    group: string; 
    decoStop15m?: number;
    decoStop12m?: number;
    decoStop9m?: number;
    decoStop6m?: number;
    totalDeco: number 
  }> = {
    7: { group: 'B', totalDeco: 3 },
    10: { group: 'D', totalDeco: 9 },
    15: { group: 'F', totalDeco: 17, decoStop6m: 8 },
    20: { group: 'H', totalDeco: 24, decoStop9m: 6, decoStop6m: 7 },
    25: { group: 'J', totalDeco: 40, decoStop12m: 4, decoStop9m: 5, decoStop6m: 8 },
    30: { group: 'K', totalDeco: 55, decoStop12m: 6, decoStop9m: 6, decoStop6m: 9 },
    35: { group: 'M', totalDeco: 67, decoStop12m: 5, decoStop9m: 6, decoStop6m: 10 },
    40: { group: 'O', totalDeco: 84, decoStop12m: 6, decoStop9m: 7, decoStop6m: 15 },
    45: { group: 'NRG', totalDeco: 101, decoStop12m: 5, decoStop9m: 8, decoStop6m: 21 },
    50: { group: 'NRG', totalDeco: 121, decoStop12m: 7, decoStop9m: 8, decoStop6m: 27 },
    55: { group: 'NRG', totalDeco: 144, decoStop15m: 3, decoStop12m: 5, decoStop9m: 9, decoStop6m: 33 },
    60: { group: 'NRG', totalDeco: 168, decoStop15m: 3, decoStop12m: 5, decoStop9m: 12, decoStop6m: 38 },
    65: { group: 'NRG', totalDeco: 194, decoStop15m: 4, decoStop12m: 5, decoStop9m: 16, decoStop6m: 42 },
    70: { group: 'NRG', totalDeco: 218, decoStop15m: 5, decoStop12m: 5, decoStop9m: 20, decoStop6m: 48 },
    75: { group: 'NRG', totalDeco: 240, decoStop15m: 5, decoStop12m: 6, decoStop9m: 24, decoStop6m: 55 },
    80: { group: 'NRG', totalDeco: 261, decoStop15m: 6, decoStop12m: 6, decoStop9m: 28, decoStop6m: 63 }
  };

  calculateDiveTable(depth: number, duration: number, tableType: "DCIEM" | "US_NAVY" | "RECREATIONAL"): DiveTableResult {
    // Round up depth if below 6m
    const roundedDepth = depth < 6 ? 6 : Math.ceil(depth);

    if (tableType === "DCIEM") {
      if (roundedDepth === 6) {
        const timeKeys = Object.keys(this.DCIEM_6M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];

        return {
          residualGroup: this.DCIEM_6M_TABLE[roundedTime],
          decompression: 1  // From CSV, all 6m dives have 1 minute decompression time
        };
      } else if (roundedDepth === 9) {
        const timeKeys = Object.keys(this.DCIEM_9M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_9M_TABLE[roundedTime];

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco
        };
      } else if (roundedDepth === 12) {
        const timeKeys = Object.keys(this.DCIEM_12M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_12M_TABLE[roundedTime];

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco
        };
      } else if (roundedDepth === 15) {
        const timeKeys = Object.keys(this.DCIEM_15M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_15M_TABLE[roundedTime];

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco
        };
      } else if (roundedDepth === 18) {
        const timeKeys = Object.keys(this.DCIEM_18M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_18M_TABLE[roundedTime];

        // Add decompression stop at 6m if specified
        const decoStopSegment = tableEntry.decoStop6m ? {
          startDepth: 6,
          endDepth: 6,
          duration: tableEntry.decoStop6m,
          gas: {fO2: 0.21, fHe: 0}
        } : null;

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStopSegment ? [decoStopSegment] : []
        };
      } else if (roundedDepth === 21) {
        const timeKeys = Object.keys(this.DCIEM_21M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_21M_TABLE[roundedTime];

        // Add decompression stop at 6m if specified
        const decoStopSegment = tableEntry.decoStop6m ? {
          startDepth: 6,
          endDepth: 6,
          duration: tableEntry.decoStop6m,
          gas: {fO2: 0.21, fHe: 0}
        } : null;

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStopSegment ? [decoStopSegment] : []
        };
      } else if (roundedDepth === 24) {
        const timeKeys = Object.keys(this.DCIEM_24M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_24M_TABLE[roundedTime];

        // Create decompression stops array
        const decoStops = [];

        // Add 9m stop if specified
        if (tableEntry.decoStop9m) {
          decoStops.push({
            startDepth: 9,
            endDepth: 9,
            duration: tableEntry.decoStop9m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 6m stop if specified
        if (tableEntry.decoStop6m) {
          decoStops.push({
            startDepth: 6,
            endDepth: 6,
            duration: tableEntry.decoStop6m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStops
        };
      } else if (roundedDepth === 27) {
        const timeKeys = Object.keys(this.DCIEM_27M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_27M_TABLE[roundedTime];

        // Create decompression stops array
        const decoStops = [];

        // Add 9m stop if specified
        if (tableEntry.decoStop9m) {
          decoStops.push({
            startDepth: 9,
            endDepth: 9,
            duration: tableEntry.decoStop9m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 6m stop if specified
        if (tableEntry.decoStop6m) {
          decoStops.push({
            startDepth: 6,
            endDepth: 6,
            duration: tableEntry.decoStop6m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStops
        };
      } else if (roundedDepth === 30) {
      // 30m table logic
      const timeKeys = Object.keys(this.DCIEM_30M_TABLE).map(Number);
      const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
      const tableEntry = this.DCIEM_30M_TABLE[roundedTime];

      // Create decompression stops array
      const decoStops = [];

      // Add 12m stop if specified
      if (tableEntry.decoStop12m) {
        decoStops.push({
          startDepth: 12,
          endDepth: 12,
          duration: tableEntry.decoStop12m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 9m stop if specified
      if (tableEntry.decoStop9m) {
        decoStops.push({
          startDepth: 9,
          endDepth: 9,
          duration: tableEntry.decoStop9m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 6m stop if specified
      if (tableEntry.decoStop6m) {
        decoStops.push({
          startDepth: 6,
          endDepth: 6,
          duration: tableEntry.decoStop6m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      return {
        residualGroup: tableEntry.group,
        decompression: tableEntry.totalDeco,
        decompressionStops: decoStops
      };
    } else if (roundedDepth === 33) {
        const timeKeys = Object.keys(this.DCIEM_33M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_33M_TABLE[roundedTime];

        // Create decompression stops array
        const decoStops = [];

        // Add 12m stop if specified
        if (tableEntry.decoStop12m) {
          decoStops.push({
            startDepth: 12,
            endDepth: 12,
            duration: tableEntry.decoStop12m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 9m stop if specified
        if (tableEntry.decoStop9m) {
          decoStops.push({
            startDepth: 9,
            endDepth: 9,
            duration: tableEntry.decoStop9m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 6m stop if specified
        if (tableEntry.decoStop6m) {
          decoStops.push({
            startDepth: 6,
            endDepth: 6,
            duration: tableEntry.decoStop6m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStops
        };
      } else if (roundedDepth === 36) {
        const timeKeys = Object.keys(this.DCIEM_36M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_36M_TABLE[roundedTime];

        // Create decompression stops array
        const decoStops = [];

        // Add 15m stop if specified
        if (tableEntry.decoStop15m) {
          decoStops.push({
            startDepth: 15,
            endDepth: 15,
            duration: tableEntry.decoStop15m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 12m stop if specified
        if (tableEntry.decoStop12m) {
          decoStops.push({
            startDepth: 12,
            endDepth: 12,
            duration: tableEntry.decoStop12m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 9m stop if specified
        if (tableEntry.decoStop9m) {
          decoStops.push({
            startDepth: 9,
            endDepth: 9,
            duration: tableEntry.decoStop9m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 6m stop if specified
        if (tableEntry.decoStop6m) {
          decoStops.push({
            startDepth: 6,
            endDepth: 6,
            duration: tableEntry.decoStop6m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStops
        };
      } else if (roundedDepth === 39) {
        const timeKeys = Object.keys(this.DCIEM_39M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_39M_TABLE[roundedTime];

        // Create decompression stops array
        const decoStops = [];

        // Add 15m stop if specified
        if (tableEntry.decoStop15m) {
          decoStops.push({
            startDepth: 15,
            endDepth: 15,
            duration: tableEntry.decoStop15m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 12m stop if specified
        if (tableEntry.decoStop12m) {
          decoStops.push({
            startDepth: 12,
            endDepth: 12,
            duration: tableEntry.decoStop12m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 9m stop if specified
        if (tableEntry.decoStop9m) {
          decoStops.push({
            startDepth: 9,
            endDepth: 9,
            duration: tableEntry.decoStop9m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 6m stop if specified
        if (tableEntry.decoStop6m) {
          decoStops.push({
            startDepth: 6,
            endDepth: 6,
            duration: tableEntry.decoStop6m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStops
        };
      } else if (roundedDepth === 42) {
        const timeKeys = Object.keys(this.DCIEM_42M_TABLE).map(Number);
        const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
        const tableEntry = this.DCIEM_42M_TABLE[roundedTime];

        // Create decompression stops array
        const decoStops = [];

        // Add 15m stop if specified
        if (tableEntry.decoStop15m) {
          decoStops.push({
            startDepth: 15,
            endDepth: 15,
            duration: tableEntry.decoStop15m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 12m stop if specified
        if (tableEntry.decoStop12m) {
          decoStops.push({
            startDepth: 12,
            endDepth: 12,
            duration: tableEntry.decoStop12m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 9m stop if specified
        if (tableEntry.decoStop9m) {
          decoStops.push({
            startDepth: 9,
            endDepth: 9,
            duration: tableEntry.decoStop9m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        // Add 6m stop if specified
        if (tableEntry.decoStop6m) {
          decoStops.push({
            startDepth: 6,
            endDepth: 6,
            duration: tableEntry.decoStop6m,
            gas: {fO2: 0.21, fHe: 0}
          });
        }

        return {
          residualGroup: tableEntry.group,
          decompression: tableEntry.totalDeco,
          decompressionStops: decoStops
        };
      } else if (roundedDepth === 45) {
      const timeKeys = Object.keys(this.DCIEM_45M_TABLE).map(Number);
      const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
      const tableEntry = this.DCIEM_45M_TABLE[roundedTime];

      // Create decompression stops array
      const decoStops = [];

      // Add 15m stop if specified
      if (tableEntry.decoStop15m) {
        decoStops.push({
          startDepth: 15,
          endDepth: 15,
          duration: tableEntry.decoStop15m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 12m stop if specified
      if (tableEntry.decoStop12m) {
        decoStops.push({
          startDepth: 12,
          endDepth: 12,
          duration: tableEntry.decoStop12m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 9m stop if specified
      if (tableEntry.decoStop9m) {
        decoStops.push({
          startDepth: 9,
          endDepth: 9,
          duration: tableEntry.decoStop9m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 6m stop if specified
      if (tableEntry.decoStop6m) {
        decoStops.push({
          startDepth: 6,
          endDepth: 6,
          duration: tableEntry.decoStop6m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      return {
        residualGroup: tableEntry.group,
        decompression: tableEntry.totalDeco,
        decompressionStops: decoStops
      };
    } else if (roundedDepth === 48) {
      const timeKeys = Object.keys(this.DCIEM_48M_TABLE).map(Number);
      const roundedTime = timeKeys.find(time => duration <= time) || timeKeys[timeKeys.length - 1];
      const tableEntry = this.DCIEM_48M_TABLE[roundedTime];

      // Create decompression stops array
      const decoStops = [];

      // Add 15m stop if specified
      if (tableEntry.decoStop15m) {
        decoStops.push({
          startDepth: 15,
          endDepth: 15,
          duration: tableEntry.decoStop15m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 12m stop if specified
      if (tableEntry.decoStop12m) {
        decoStops.push({
          startDepth: 12,
          endDepth: 12,
          duration: tableEntry.decoStop12m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 9m stop if specified
      if (tableEntry.decoStop9m) {
        decoStops.push({
          startDepth: 9,
          endDepth: 9,
          duration: tableEntry.decoStop9m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      // Add 6m stop if specified
      if (tableEntry.decoStop6m) {
        decoStops.push({
          startDepth: 6,
          endDepth: 6,
          duration: tableEntry.decoStop6m,
          gas: {fO2: 0.21, fHe: 0}
        });
      }

      return {
        residualGroup: tableEntry.group,
        decompression: tableEntry.totalDeco,
        decompressionStops: decoStops
      };
    }
    }

    // Default return if no matching table entry
    return {
      residualGroup: 'A',
      decompression: 0
    };
  }

  calculateDecompression(segments: DiveSegment[], options: PlannerOptions): DiveResult {
    const maxDepth = Math.max(...segments.map(s => Math.max(s.startDepth, s.endDepth)));
    const totalTime = segments.reduce((sum, seg) => sum + seg.duration, 0);

    // Use dive table calculation for decompression
    const tableResult = this.calculateDiveTable(maxDepth, totalTime, options.tableType);

        // Basic decompression stops based on table result
        const decoStops = tableResult.decompressionStops ?  [
          ...tableResult.decompressionStops,
          {
              startDepth: 3,
              endDepth: 3,
              duration: tableResult.decompression - (tableResult.decompressionStops?.reduce((sum, stop) => sum + stop.duration, 0) || 0),
              gas: segments[0].gas
          }
        ] : tableResult.decompression > 0 ? [
          {
            startDepth: 3,
            endDepth: 3,
            duration: tableResult.decompression,
            gas: segments[0].gas
          }
        ] : [];


    return {
      plan: {
        segments,
        totalTime: totalTime + (decoStops.reduce((sum, stop) => sum + stop.duration, 0)),
        maxDepth,
        gases: segments.map(s => s.gas)
      },
      decompression: decoStops,
      cns: this.calculateCNS(segments),
      otu: this.calculateOTU(segments),
      tableGroup: tableResult.residualGroup
    };
  }

  calculateGasSupply(supplyVolume: number, supplyPressure: number, consumptionRate: number): GasSupplyResult {
    return this.gasSupplyCalculator.calculateGasSupply(supplyVolume, supplyPressure, consumptionRate);
  }

  getConsumptionRates(): number[] {
    return this.gasSupplyCalculator.getConsumptionRates();
  }

  private calculateBasicNDL(depth: number): number {
    if (depth < 10) return 180;
    if (depth < 20) return 60;
    if (depth < 30) return 25;
    return 15;
  }

  private calculateCNS(segments: DiveSegment[]): number {
    return segments.reduce((total, segment) => {
      const avgDepth = (segment.startDepth + segment.endDepth) / 2;
      const pressure = (avgDepth / 10) + this.surfacePressure;
      const ppO2 = segment.gas.fO2 * pressure;
      return total + (ppO2 > 1.4 ? segment.duration * 0.5 : segment.duration * 0.25);
    }, 0);
  }

  private calculateOTU(segments: DiveSegment[]): number {
    return segments.reduce((total, segment) => {
      const avgDepth = (segment.startDepth + segment.endDepth) / 2;
      const pressure = (avgDepth / 10) + this.surfacePressure;
      const ppO2 = segment.gas.fO2 * pressure;
      return total + (ppO2 > 0.5 ? segment.duration * ppO2 : 0);
    }, 0);
  }
}

export const gasPlannerCalculator = new GasPlannerCalculator();
// Basic gas calculation utilities
import type { Gas } from './types';

export const GAS_MIXES: Record<string, Gas> = {
  air: { fO2: 0.21, fHe: 0 },
  nitrox32: { fO2: 0.32, fHe: 0 },
  nitrox36: { fO2: 0.36, fHe: 0 },
  trimix1845: { fO2: 0.18, fHe: 0.45 },
  trimix1070: { fO2: 0.10, fHe: 0.70 },
  oxygen: { fO2: 1.0, fHe: 0 },
};

export function calculateMOD(gas: Gas, maxPpO2: number): number {
  return (maxPpO2 / gas.fO2 - 1) * 10;
}

export function calculatePpO2(gas: Gas, depth: number): number {
  const pressure = (depth / 10) + 1;
  return gas.fO2 * pressure;
}

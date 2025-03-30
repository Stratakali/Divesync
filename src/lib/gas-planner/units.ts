export const METERS_TO_FEET = 3.28084;
export const BAR_TO_PSI = 14.5038;
export const LITER_TO_CUFT = 0.035315;

export function metersToFeet(meters: number): number {
  return meters * METERS_TO_FEET;
}

export function feetToMeters(feet: number): number {
  return feet / METERS_TO_FEET;
}

export function barToPsi(bar: number): number {
  return bar * BAR_TO_PSI;
}

export function psiToBar(psi: number): number {
  return psi / BAR_TO_PSI;
}

export function litersToCuft(liters: number): number {
  return liters * LITER_TO_CUFT;
}

export function cuftToLiters(cuft: number): number {
  return cuft / LITER_TO_CUFT;
}

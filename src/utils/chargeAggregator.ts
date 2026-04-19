import { ExtraCharge, Charges } from '../types/charge';

/**
 * Aggregates locally-stored extra charges into the API payload shape.
 *
 * Mapping rules:
 *  - MCD     → mcFare
 *  - Toll    → tollCharge
 *  - Parking → parkingCharge
 *
 * Always returns all three fields so the API never receives undefined.
 * Missing or zero-charge trips produce { mcFare: 0, tollCharge: 0, parkingCharge: 0 }.
 */
export function aggregateCharges(extraCharges: ExtraCharge[]): Charges {
  let mcFare = 0;
  let tollCharge = 0;
  let parkingCharge = 0;

  for (const charge of extraCharges) {
    if (charge.type === 'MCD') {
      mcFare += charge.amount;
    } else if (charge.type === 'Toll') {
      tollCharge += charge.amount;
    } else if (charge.type === 'Parking') {
      parkingCharge += charge.amount;
    }
  }

  return { mcFare, tollCharge, parkingCharge };
}

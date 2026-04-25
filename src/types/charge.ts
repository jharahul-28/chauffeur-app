export type ChargeType = 'MC_FARE' | 'TOLL_CHARGE' | 'PARKING_CHARGE';

export interface Charge {
  type: ChargeType;
  amount: number;
}

export const CHARGE_DISPLAY_NAME: Record<ChargeType, string> = {
  MC_FARE: 'MCD',
  TOLL_CHARGE: 'Toll',
  PARKING_CHARGE: 'Parking',
};

export const CHARGE_ORDER: ChargeType[] = ['MC_FARE', 'TOLL_CHARGE', 'PARKING_CHARGE'];

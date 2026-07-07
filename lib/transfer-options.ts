export const TRANSFER_AMENITIES = [
  "Air conditioning",
  "WiFi",
  "Bottled water",
  "Child seat available",
  "Phone charger",
  "Wheelchair accessible",
  "Leather seats",
  "Extra luggage space",
] as const;

export const DRIVER_LANGUAGES = [
  "English",
  "Arabic",
  "French",
  "German",
  "Russian",
  "Spanish",
  "Italian",
] as const;

export type TransferVehicleClassInfo = {
  name: string;
  tier: number;
  exampleModels: string | null;
  imageUrl: string | null;
  amenities: string[];
  driverLanguages: string[];
  maxPax: number;
  maxLuggage: number | null;
  isActive: boolean;
};

export type TransferRateWithClass = {
  rateId: string;
  vehicleType: string;
  maxPax: number;
  maxLuggage: number | null;
  sellPrice: number;
  vehicleClass: TransferVehicleClassInfo | null;
};

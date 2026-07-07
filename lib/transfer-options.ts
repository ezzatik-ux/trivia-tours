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

// Row returned by getTransferBookingById (snake_case keys match the SQL aliases).
// Nullability mirrors lib/db/schema.ts; from_name/to_name are INNER JOINs (non-null),
// country_name is a LEFT JOIN (nullable).
export type TransferBookingDetail = {
  id: string;
  booking_no: string;
  sales_order_no: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  transfer_date: string;
  pickup_time: string | null;
  flight_number: string | null;
  pax: number;
  num_vehicles: number;
  vehicle_type: string;
  luggage_count: number | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  total_price: number;
  status: string;
  special_requests: string | null;
  created_at: string;
  trip_type: string;
  arrival_terminal: string | null;
  greeting_sign: string | null;
  return_date: string | null;
  return_pickup_time: string | null;
  return_flight_number: string | null;
  return_terminal: string | null;
  from_name: string;
  to_name: string;
  country_name: string | null;
  estimated_duration_min: number | null;
  rate_max_pax: number;
  rate_max_luggage: number | null;
  vehicleClass: TransferVehicleClassInfo | null;
};

export type TransferRateWithClass = {
  rateId: string;
  vehicleType: string;
  maxPax: number;
  maxLuggage: number | null;
  sellPrice: number;
  vehicleClass: TransferVehicleClassInfo | null;
};

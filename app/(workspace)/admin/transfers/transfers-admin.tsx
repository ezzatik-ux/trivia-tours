"use client";

import { TransfersNav } from "./transfers-nav";
import { RoutesTable } from "./routes-table";
import type { TransferRouteRow } from "./actions";

type Location = {
  id: string;
  name: string;
  type: string;
  cityName: string | null;
  code: string | null;
  isActive: boolean;
  countryId: string;
  countryName: string | null;
};

type Country = { id: string; code: string | null; name: string };
type Supplier = { id: string; name: string };

type Props = {
  locations: Location[];
  routes: TransferRouteRow[];
  countries: Country[];
  suppliers: Supplier[];
};

export function TransfersAdmin({ locations, routes, countries, suppliers }: Props) {
  return (
    <>
      <TransfersNav />
      <RoutesTable
        routes={routes}
        locations={locations.filter((l) => l.isActive)}
        countries={countries}
        suppliers={suppliers}
      />
    </>
  );
}

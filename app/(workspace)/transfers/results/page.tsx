import { requireAuth } from "@/lib/auth-utils";
import { searchTransfers } from "../actions";
import { TransferResults } from "./transfer-results";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  date?: string;
  pax?: string;
}>;

export default async function TransferResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const params = await searchParams;

  const results = await searchTransfers({
    fromLocationId: params.from ?? "",
    toLocationId: params.to ?? "",
    pax: params.pax ? parseInt(params.pax) : undefined,
  });

  return (
    <TransferResults
      results={results}
      date={params.date ?? ""}
      pax={params.pax ? parseInt(params.pax) : 2}
      searchQuery={new URLSearchParams({
        from: params.from ?? "",
        to: params.to ?? "",
        date: params.date ?? "",
        pax: params.pax ?? "2",
      }).toString()}
    />
  );
}

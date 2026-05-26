import { requireAuth } from "@/lib/auth-utils";
import { getTransferSearchOptions } from "./actions";
import { TransferSearchHero } from "./transfer-search-hero";

export default async function TransfersLandingPage() {
  await requireAuth();
  const locations = await getTransferSearchOptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Transfers</h1>
        <p className="text-slate-500 mt-1">
          Search airport and point-to-point transfers across your routes
        </p>
      </div>
      <TransferSearchHero locations={locations} />
    </div>
  );
}

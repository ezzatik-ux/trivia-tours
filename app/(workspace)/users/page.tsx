import { requireRole } from "@/lib/auth-utils";
import { getAllUsers, getCountriesForSelector } from "./actions";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const user = await requireRole(["ADMIN"]);
  const [allUsers, countries] = await Promise.all([
    getAllUsers(),
    getCountriesForSelector(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500 mt-1">Manage team members, roles, and country access</p>
      </div>
      <UsersTable users={allUsers} countries={countries} currentUserId={user.id} />
    </div>
  );
}

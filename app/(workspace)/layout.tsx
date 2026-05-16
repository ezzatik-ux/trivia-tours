import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNavWrapper } from "@/components/layout/mobile-bottom-nav-wrapper";
import { SessionProvider } from "@/components/session-provider";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {session.user.id && <MobileHeader currentUserId={session.user.id} />}

          <div className="hidden md:block">
            <Topbar />
          </div>

          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </main>
        </div>

        <MobileBottomNavWrapper />
      </div>
    </SessionProvider>
  );
}

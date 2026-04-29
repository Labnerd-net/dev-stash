import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider } from "@/components/app/SidebarContext";
import { Sidebar } from "@/components/app/Sidebar";
import { Header } from "@/components/app/Header";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userId={session.user.id} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header user={session.user} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
      <Toaster position="bottom-right" duration={2000} />
    </SidebarProvider>
  );
}

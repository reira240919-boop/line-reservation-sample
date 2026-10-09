import { requireAuth } from "@/lib/auth";
import Nav from "@/components/Nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
    </div>
  );
}

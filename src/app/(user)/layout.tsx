import { PlanProvider } from "@/context/PlanContext";
import { UserNav } from "@/components/user/UserNav";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlanProvider>
      <UserNav />
      {children}
    </PlanProvider>
  );
}

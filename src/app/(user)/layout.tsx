// src/app/(user)/layout.tsx
import { Providers } from "@/components/user/Providers";
import { UserNav } from "@/components/user/UserNav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <UserNav />
      <main>{children}</main>
    </Providers>
  );
}
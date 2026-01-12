"use client"
import { ReactNode } from "react";
import { ResponsiveNavBar } from "@/components/ResponsiveNavBar";
import { UserProvider } from "@/lib/UserContext";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <ResponsiveNavBar />
      {/* Add padding to avoid content under nav bar */}
      <div className="pt-0 md:pt-[72px] pb-[72px] md:pb-0" />
      {children}
    </UserProvider>
  );
}

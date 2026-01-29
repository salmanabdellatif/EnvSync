"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { MobileSidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <DashboardHeader
        isMenuOpen={isOpen}
        onMenuClick={() => setIsOpen(!isOpen)}
      />

      {/* Mobile Sidebar Drawer - smaller width, glassy bg */}
      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="left">
        <DrawerContent className="h-full w-48 rounded-none backdrop-blur-lg bg-black/20 border-r border-white/10 shadow-2xl">
          <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
          <MobileSidebar onClose={() => setIsOpen(false)} />
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </>
  );
}

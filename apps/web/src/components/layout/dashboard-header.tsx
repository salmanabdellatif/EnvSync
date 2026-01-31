"use client";

import { useAuth } from "@/providers/auth-provider";
import { UserAvatar } from "@/components/ui/user-avatar";
import { HamburgerMenu } from "@/components/icons";

interface DashboardHeaderProps {
  isMenuOpen: boolean;
  onMenuClick: () => void;
}

export function DashboardHeader({
  isMenuOpen,
  onMenuClick,
}: DashboardHeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 backdrop-blur-xl bg-background/70">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Avatar + Name */}
        <div className="flex items-center gap-3">
          <UserAvatar name={user.name} avatar={user.avatar} size="md" />
          <span className="text-sm font-medium">{user.name}</span>
        </div>

        {/* Right: Menu button (mobile/tablet only) */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <HamburgerMenu isOpen={isMenuOpen} />
        </button>
      </div>
    </header>
  );
}

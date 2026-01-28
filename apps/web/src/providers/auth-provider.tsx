"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { type User } from "@/lib/schemas";
import { logoutAction } from "@/actions/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User | null;
}) {
  const [user] = useState<User | null>(initialUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        logout: logoutAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

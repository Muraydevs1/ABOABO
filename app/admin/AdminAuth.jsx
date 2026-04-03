"use client";

import { useAuth, RedirectToSignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminAuth({ children }) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <ClerkLoaded>
      <AdminLayout>{children}</AdminLayout>
    </ClerkLoaded>
  );
}
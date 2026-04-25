"use client";

import { useAuth, RedirectToSignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import StoreLayout from "@/components/store/StoreLayout";

export default function StoreAuth({ children }) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <ClerkLoaded>
      <StoreLayout>{children}</StoreLayout>
    </ClerkLoaded>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

export default function Home() {
  const router = useRouter();
  const { user, loadUser } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load user from localStorage on mount
    loadUser();
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only redirect after we've tried to load the user
    if (!isReady) return;

    // Redirect based on authentication status
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/pending-requests");
      } else {
        router.push("/acceuil");
      }
    } else {
      router.push("/login");
    }
  }, [user, router, isReady]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

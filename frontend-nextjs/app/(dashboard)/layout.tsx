"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, hasPermission, isAdmin, loadUser } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize store from localStorage on mount
  useEffect(() => {
    console.log("[DashboardLayout] Initializing store...");
    const initStore = async () => {
      await loadUser();
      console.log("[DashboardLayout] Store initialized");
    };
    initStore();
  }, [loadUser]);

  useEffect(() => {
    console.log("[DashboardLayout] User check effect, user:", user);
    // Give time for user to load from storage
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!user) {
        console.log("[DashboardLayout] No user found, redirecting to login");
        router.push("/login");
      } else {
        console.log("[DashboardLayout] User loaded:", user.full_name);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="relative">
            {/* Outer ring with emerald gradient */}
            <div className="relative mx-auto h-20 w-20">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-600 border-r-emerald-500"></div>
              <div
                className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-teal-600 border-l-teal-500"
                style={{ animationDelay: "150ms" }}
              ></div>
            </div>
            {/* Center glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-emerald-500 rounded-full opacity-20 animate-pulse blur-xl"></div>
            </div>
          </div>
          <p className="mt-8 text-gray-700 font-semibold text-lg">
            Chargement...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Préparation de votre espace
          </p>

          {/* Loading dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Always visible, just changes width */}
      <Sidebar
        isOpen={isSidebarOpen}
        isAdmin={isAdmin}
        hasPermission={hasPermission}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          user={user}
        />

        {/* Page Content with refined padding */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay - Only show on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

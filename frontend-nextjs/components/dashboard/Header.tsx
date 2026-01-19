"use client";

import { User } from "@/types/auth";
import { Menu, Bell, ChevronDown, User2, Settings, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User;
}

export default function Header({
  isSidebarOpen,
  toggleSidebar,
  user,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Notifications mockées
  const notifications = [
    {
      id: 1,
      title: "Nouvelle demande en attente",
      message: "Une demande d'accès nécessite votre approbation",
      time: "Il y a 5 min",
      unread: true,
    },
    {
      id: 2,
      title: "Mise à jour système",
      message: "Le système sera mis à jour ce soir à 23h",
      time: "Il y a 1h",
      unread: true,
    },
    {
      id: 3,
      title: "Rapport mensuel disponible",
      message: "Le rapport du mois de janvier est prêt",
      time: "Il y a 3h",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full flex items-center justify-between px-4 sm:px-6">
        {/* Left: Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="group relative p-2.5 rounded-xl text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 active:scale-95"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        </button>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="group relative p-2.5 rounded-xl text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-base">
                        Notifications
                      </h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">
                            {unreadCount}
                          </span>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors sm:hidden"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-all duration-150 cursor-pointer group ${
                          notification.unread ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          {notification.unread && (
                            <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 shrink-0 shadow-lg" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1.5">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <button className="w-full text-sm font-semibold text-emerald-600 hover:text-emerald-700 py-1.5 transition-colors duration-200 hover:underline">
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-gray-200" />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
            >
              {/* User Info - Hidden on mobile */}
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {user.titre} {user.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {user.role === "admin" ? "Administrateur" : user.poste}
                </p>
              </div>

              {/* Avatar */}
              <div className="relative">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg ring-2 ring-white group-hover:ring-emerald-100 transition-all duration-200">
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {getInitials(user.full_name)}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
              </div>

              {/* Dropdown Icon - Hidden on mobile */}
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block group-hover:text-emerald-600 transition-all duration-200 group-hover:translate-y-0.5" />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfile(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="px-5 py-5 border-b border-gray-100 bg-emerald-50">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shrink-0">
                        <span className="text-white font-bold text-lg">
                          {getInitials(user.full_name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {user.titre} {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          {user.role === "admin" ? "Admin" : user.poste}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  FileText,
  Zap,
  Calculator,
  BookOpen,
  Bell,
  Users,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { MenuItem } from "./types";

interface SidebarProps {
  isOpen: boolean;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
  onLogout: () => void;
}

export default function Sidebar({
  isOpen,
  isAdmin,
  hasPermission,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      name: "Accueil",
      path: "/accueil",
      icon: <Home className="w-5 h-5" />,
      permission: null,
    },
    {
      name: "Profil Client",
      path: "/profil",
      icon: <User className="w-5 h-5" />,
      permission: "view_profil",
    },
    {
      name: "Reconstitution",
      path: "/reconstitution",
      icon: <FileText className="w-5 h-5" />,
      permission: "view_reconstitution",
    },
    {
      name: "Optimisation",
      path: "/optimisation",
      icon: <Zap className="w-5 h-5" />,
      permission: "view_optimisation",
    },
    {
      name: "Simulateur",
      path: "/simulateur",
      icon: <Calculator className="w-5 h-5" />,
      permission: "view_simulateur",
    },
    {
      name: "Documentation",
      path: "/documentation",
      icon: <BookOpen className="w-5 h-5" />,
      permission: null,
    },
  ];

  const adminMenuItems: MenuItem[] = [
    {
      name: "Demandes pendantes",
      path: "/admin/pending-requests",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      name: "Gestion utilisateurs",
      path: "/admin/users",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.permission === null) return true;
    return item.permission ? hasPermission(item.permission) : true;
  });

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 shadow-2xl flex flex-col ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo Header */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-white/10 shrink-0 relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

        <div
          className={`flex items-center gap-3 relative z-10 transition-all duration-300 ${isOpen ? "" : "justify-center"}`}
        >
          {/* Logo Icon - Lightning bolt in rounded square */}
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>

          {/* Logo Text */}
          {isOpen && (
            <div className="transition-opacity duration-300">
              <h1 className="text-xl font-bold text-white tracking-tight">
                SABC
              </h1>
              <p className="text-xs text-white/80 font-medium">Optimisation</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {/* Dashboard Menu */}
        <div className="mb-8">
          {isOpen && (
            <h3 className="px-3 mb-3 text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Dashboard
            </h3>
          )}
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-emerald-700 shadow-lg"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    } ${!isOpen && "justify-center"}`}
                    title={!isOpen ? item.name : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-700 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <span
                      className={`relative z-10 transition-all duration-200 ${
                        isActive
                          ? "text-emerald-700 scale-110"
                          : "text-white/80 group-hover:text-white group-hover:scale-105"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {/* Text */}
                    {isOpen && (
                      <span className="relative z-10 flex-1 whitespace-nowrap">
                        {item.name}
                      </span>
                    )}

                    {/* Hover effect - subtle glow */}
                    <div
                      className={`absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/5 transition-all duration-300 ${isActive && "opacity-0"}`}
                    />

                    {/* Arrow indicator for active (only when expanded) */}
                    {isActive && isOpen && (
                      <ChevronRight className="w-4 h-4 text-emerald-700" />
                    )}

                    {/* Active dot indicator (only when collapsed) */}
                    {isActive && !isOpen && (
                      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Admin Menu */}
        {isAdmin() && (
          <div className="mb-8">
            {isOpen && (
              <h3 className="px-3 mb-3 text-[10px] font-bold text-white/60 uppercase tracking-widest">
                Administration
              </h3>
            )}
            {!isOpen && <div className="h-px bg-white/20 mb-4" />}
            <ul className="space-y-1">
              {adminMenuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-white text-emerald-700 shadow-lg"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      } ${!isOpen && "justify-center"}`}
                      title={!isOpen ? item.name : undefined}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-700 rounded-r-full" />
                      )}

                      {/* Icon */}
                      <span
                        className={`relative z-10 transition-all duration-200 ${
                          isActive
                            ? "text-emerald-700 scale-110"
                            : "text-white/80 group-hover:text-white group-hover:scale-105"
                        }`}
                      >
                        {item.icon}
                      </span>

                      {/* Text */}
                      {isOpen && (
                        <span className="relative z-10 flex-1 whitespace-nowrap">
                          {item.name}
                        </span>
                      )}

                      {/* Hover effect */}
                      <div
                        className={`absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/5 transition-all duration-300 ${isActive && "opacity-0"}`}
                      />

                      {/* Arrow indicator for active (only when expanded) */}
                      {isActive && isOpen && (
                        <ChevronRight className="w-4 h-4 text-emerald-700" />
                      )}

                      {/* Active dot indicator (only when collapsed) */}
                      {isActive && !isOpen && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Logout Button - Fixed at Bottom */}
      <div className="shrink-0 p-3 border-t border-white/10 bg-emerald-800/30 backdrop-blur-sm">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200 group ${!isOpen && "justify-center"}`}
          title={!isOpen ? "Déconnexion" : undefined}
        >
          <LogOut className="w-5 h-5 text-white/80 group-hover:text-white transition-all duration-200 group-hover:scale-105" />
          {isOpen && <span className="flex-1 text-left">Déconnexion</span>}
          {isOpen && (
            <div className="w-2 h-2 rounded-full bg-white/40 group-hover:bg-white transition-all duration-200" />
          )}
        </button>
      </div>
    </aside>
  );
}

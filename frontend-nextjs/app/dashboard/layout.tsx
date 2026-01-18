"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, hasPermission, isAdmin, loadUser } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  // Initialize store from localStorage on mount
  useEffect(() => {
    console.log('[DashboardLayout] Initializing store...');
    const initStore = async () => {
      await loadUser();
      console.log('[DashboardLayout] Store initialized');
    };
    initStore();
  }, []); // Run once on mount

  useEffect(() => {
    console.log('[DashboardLayout] User check effect, user:', user);
    // Give time for user to load from storage
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!user) {
        console.log('[DashboardLayout] No user found, redirecting to login');
        router.push('/login');
      } else {
        console.log('[DashboardLayout] User loaded:', user.full_name);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    {
      name: 'Accueil',
      path: '/dashboard/accueil',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      permission: null, // Always visible
    },
    {
      name: 'Profil Client',
      path: '/dashboard/profil',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      permission: 'view_profil',
    },
    {
      name: 'Reconstitution',
      path: '/dashboard/reconstitution',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      permission: 'view_reconstitution',
    },
    {
      name: 'Optimisation',
      path: '/dashboard/optimisation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      permission: 'view_optimisation',
    },
    {
      name: 'Simulateur',
      path: '/dashboard/simulateur',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      permission: 'view_simulateur',
    },
    {
      name: 'Documentation',
      path: '/dashboard/documentation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      permission: null, // Always visible
    },
  ];

  const adminMenuItems = [
    {
      name: 'Demandes pendantes',
      path: '/admin/pending-requests',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      name: 'Gestion utilisateurs',
      path: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.permission === null) return true;
    return hasPermission(item.permission);
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 w-64`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-primary-600">SABC</h1>
            <p className="text-xs text-gray-500">Optimisation</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Dashboard Menu */}
          <div className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Dashboard
            </h3>
            <ul className="space-y-1">
              {visibleMenuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.path
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin Menu */}
          {isAdmin() && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Administration
              </h3>
              <ul className="space-y-1">
                {adminMenuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pathname === item.path
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.titre} {user.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {user.role === 'admin' ? 'Administrateur' : user.poste}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {user.full_name.charAt(0)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              title="Déconnexion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

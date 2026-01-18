"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Attempt redirect
    const timer = setTimeout(() => {
      router.replace('/dashboard/accueil');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="mt-4 text-gray-600 mb-4">Redirection vers le tableau de bord...</p>
        <Link
          href="/dashboard/accueil"
          className="text-primary-600 hover:text-primary-700 underline text-sm"
        >
          Cliquez ici si la redirection ne fonctionne pas
        </Link>
      </div>
    </div>
  );
}

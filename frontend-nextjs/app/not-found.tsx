"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  ArrowLeft,
  Zap,
  Search,
  AlertCircle,
  Map,
  Compass,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const popularPages = [
    { name: "Accueil", path: "/", icon: Home },
    { name: "Dashboard", path: "/accueil", icon: Compass },
    { name: "Connexion", path: "/login", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 flex items-center justify-center p-6 overflow-hidden relative">
      <div
        className={`relative z-10 max-w-4xl w-full transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className=" rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full" />
              <div className="absolute bottom-10 right-10 w-40 h-40 border-4 border-white rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white rounded-full" />
            </div>

            <div className="relative z-10 text-center">
              {/* Animated 404 */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-9xl font-black tracking-tighter animate-bounce">
                    4
                  </span>
                  <div className="relative">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-spin-slow">
                      <Search className="w-12 h-12 text-white/80" />
                    </div>
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                  </div>
                  <span className="text-9xl font-black tracking-tighter animate-bounce delay-150">
                    4
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">Page introuvable</h1>
              <p className="text-emerald-100 text-lg">
                Oups ! Cette page semble s'être égarée dans le réseau...
              </p>

              {/* Countdown */}
              <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Redirection automatique dans</span>
                  <span className="font-bold text-xl px-2 py-1 bg-white/20 rounded-lg">
                    {countdown}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
}

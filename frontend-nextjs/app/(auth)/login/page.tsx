"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, user } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/pending-requests");
      } else {
        router.push("/acceuil");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const errors = {
      email: "",
      password: "",
    };

    if (!formData.email) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      errors.password = "Le mot de passe est requis";
    }

    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      const currentUser = useAuthStore.getState().user;
      console.log("Login successful, user:", currentUser);
      if (currentUser) {
        if (currentUser.role === "admin") {
          console.log("Redirecting to admin panel");
          router.push("/admin/pending-requests");
        } else {
          console.log("Redirecting to dashboard");
          router.push("/acceuil");
        }
      } else {
        console.error("Login succeeded but no user in store");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-900/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
          <div className="max-w-md w-full space-y-8">
            {/* Logo & Brand */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-9 h-9 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-3">Optimisation SABC</h1>
              <p className="text-emerald-200 text-lg">
                Système de gestion de l'énergie intelligent
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-1">
                  <svg
                    className="w-4 h-4 text-emerald-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">Suivi en temps réel</p>
                  <p className="text-sm text-emerald-200">
                    Monitoring complet de votre consommation énergétique
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-1">
                  <svg
                    className="w-4 h-4 text-emerald-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">
                    Optimisation automatique
                  </p>
                  <p className="text-sm text-emerald-200">
                    Réduction des coûts grâce à l'IA
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-1">
                  <svg
                    className="w-4 h-4 text-emerald-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">Rapports détaillés</p>
                  <p className="text-sm text-emerald-200">
                    Analyses et recommandations personnalisées
                  </p>
                </div>
              </div>
            </div>

            {/* Demo credentials card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-emerald-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Compte de démonstration
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-emerald-100">
                      <span className="font-medium">Email:</span> admin@sabc.com
                    </p>
                    <p className="text-emerald-100">
                      <span className="font-medium">Mot de passe:</span>{" "}
                      Admin@2024
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Optimisation SABC
            </h1>
            <p className="text-gray-600 text-sm">
              Système de gestion de l'énergie
            </p>
          </div>

          {/* Mobile demo credentials */}
          <div className="lg:hidden mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-emerald-900 mb-2">
                    Compte de démonstration
                  </h3>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="text-emerald-800">
                      <span className="font-medium">Email:</span> admin@sabc.com
                    </p>
                    <p className="text-emerald-800">
                      <span className="font-medium">Mot de passe:</span>{" "}
                      Admin@2024
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Bienvenue
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Connectez-vous pour accéder à votre tableau de bord
            </p>
          </div>

          {/* Alert */}
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={clearError} />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Adresse email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre.email@entreprise.com"
              error={formErrors.email}
              required
              autoComplete="email"
            />

            <Input
              label="Mot de passe"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              error={formErrors.password}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200"
              isLoading={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 sm:my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">
                Pas encore de compte ?
              </span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-emerald-600 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors duration-200"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Info,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import authService from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export default function ActivatePage() {
  const router = useRouter();
  const { activate, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [otpResent, setOtpResent] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("Au moins 8 caractères");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Au moins une majuscule");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Au moins une minuscule");
    }
    if (!/\d/.test(password)) {
      errors.push("Au moins un chiffre");
    }
    return errors;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide";
    }

    if (!formData.otp) {
      errors.otp = "Le code OTP est requis";
    } else if (formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
      errors.otp = "Le code OTP doit contenir 6 chiffres";
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors.join(", ");
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await activate({
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
      });
      router.push("/acceuil");
    } catch (err) {
      // Error handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleResendOTP = async () => {
    if (!formData.email) {
      setFormErrors({ email: "Veuillez entrer votre email d'abord" });
      return;
    }

    try {
      await authService.resendOTP(formData.email);
      setOtpResent(true);
      setTimeout(() => setOtpResent(false), 5000);
    } catch (err: any) {
      setFormErrors({
        otp: err.response?.data?.detail || "Erreur lors du renvoi du code OTP",
      });
    }
  };

  const passwordStrength = formData.password
    ? validatePassword(formData.password)
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Activation du compte
          </h1>
          <p className="text-gray-600 text-sm">
            Saisissez le code OTP reçu par email pour finaliser votre
            inscription
          </p>
        </div>

        {/* Activation Card */}
        <Card className="shadow-xl border-gray-200">
          {error && <Alert type="error" message={error} onClose={clearError} />}

          {otpResent && (
            <Alert
              type="success"
              message="Un nouveau code OTP a été envoyé à votre email !"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                label="Adresse email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre.email@exemple.com"
                error={formErrors.email}
                required
                autoComplete="email"
                className="pl-10"
              />
            </div>

            {/* OTP Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  label="Code d'activation (OTP)"
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="000000"
                  error={formErrors.otp}
                  required
                  maxLength={6}
                  className="pl-10 text-center text-2xl font-semibold tracking-[0.5em] font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleResendOTP}
                className="mt-3 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Renvoyer le code
              </button>
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                label="Nouveau mot de passe"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={formErrors.password}
                required
                autoComplete="new-password"
                className="pl-10"
              />
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-500" />
                  Exigences de sécurité
                </p>
                <ul className="space-y-2">
                  <li
                    className={`flex items-center gap-2 text-sm ${
                      passwordStrength.includes("Au moins 8 caractères")
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {passwordStrength.includes("Au moins 8 caractères") ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span className="font-medium">Minimum 8 caractères</span>
                  </li>
                  <li
                    className={`flex items-center gap-2 text-sm ${
                      passwordStrength.includes("Au moins une majuscule")
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {passwordStrength.includes("Au moins une majuscule") ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span className="font-medium">Une lettre majuscule</span>
                  </li>
                  <li
                    className={`flex items-center gap-2 text-sm ${
                      passwordStrength.includes("Au moins une minuscule")
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {passwordStrength.includes("Au moins une minuscule") ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span className="font-medium">Une lettre minuscule</span>
                  </li>
                  <li
                    className={`flex items-center gap-2 text-sm ${
                      passwordStrength.includes("Au moins un chiffre")
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {passwordStrength.includes("Au moins un chiffre") ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span className="font-medium">Un chiffre</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Confirm Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                label="Confirmer le mot de passe"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                error={formErrors.confirmPassword}
                required
                autoComplete="new-password"
                className="pl-10"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/30 font-semibold"
              isLoading={isLoading}
            >
              {isLoading ? "Activation en cours..." : "Activer mon compte"}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-emerald-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 shadow-md">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 mb-2 text-sm">
                Informations importantes
              </p>
              <ul className="space-y-1.5 text-xs text-emerald-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Code OTP valide pendant 24 heures</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Vérifiez votre dossier spam si nécessaire</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Connexion automatique après activation</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

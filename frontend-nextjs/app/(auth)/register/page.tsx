"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import Verification from "./Verification";

type FormStep = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    titre: "",
    poste: "",
    entreprise: "",
    telephone: "",
    raison_demande: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide";
    }

    if (!formData.full_name) {
      errors.full_name = "Le nom complet est requis";
    } else if (formData.full_name.length < 2) {
      errors.full_name = "Le nom doit contenir au moins 2 caractères";
    }

    if (formData.telephone && !/^[\d\s\-\+\(\)]+$/.test(formData.telephone)) {
      errors.telephone = "Format de téléphone invalide";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};

    if (!formData.poste) {
      errors.poste = "Le poste est requis";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      clearError();
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateStep2()) {
      return;
    }

    try {
      const response = await register(formData);
      setSuccess(true);
      setRegisteredEmail(response.email);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
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

  if (success) {
    return <Verification registeredEmail={registeredEmail} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />

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
              <h1 className="text-4xl font-bold mb-3">Rejoignez-nous</h1>
              <p className="text-emerald-200 text-lg">
                Accédez à la plateforme de gestion énergétique
              </p>
            </div>

            {/* Steps indicator */}
            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep === 1
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50"
                      : "bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  1
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium transition-colors ${
                      currentStep === 1 ? "text-white" : "text-emerald-200"
                    }`}
                  >
                    Informations personnelles
                  </p>
                  <p className="text-sm text-emerald-300">
                    Vos coordonnées de contact
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep === 2
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50"
                      : "bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  2
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium transition-colors ${
                      currentStep === 2 ? "text-white" : "text-emerald-200"
                    }`}
                  >
                    Informations professionnelles
                  </p>
                  <p className="text-sm text-emerald-300">
                    Votre activité et raison
                  </p>
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Processus d'inscription
                  </h3>
                  <ul className="space-y-1 text-sm text-emerald-100">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Validation par un administrateur</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Réception d'un code OTP par email</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Activation sous quelques heures</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
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
              Créer un compte
            </h1>
            <p className="text-gray-600 text-sm">
              Demandez l'accès à la plateforme
            </p>
          </div>

          {/* Mobile steps indicator */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-center space-x-2">
              <div
                className={`h-2 flex-1 rounded-full transition-all ${
                  currentStep >= 1 ? "bg-emerald-600" : "bg-gray-200"
                }`}
              />
              <div
                className={`h-2 flex-1 rounded-full transition-all ${
                  currentStep >= 2 ? "bg-emerald-600" : "bg-gray-200"
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span
                className={`text-xs font-medium ${
                  currentStep === 1 ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                Personnel
              </span>
              <span
                className={`text-xs font-medium ${
                  currentStep === 2 ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                Professionnel
              </span>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {currentStep === 1 ? "Vos informations" : "Votre activité"}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {currentStep === 1
                ? "Renseignez vos coordonnées personnelles"
                : "Parlez-nous de votre activité professionnelle"}
            </p>
          </div>

          {/* Alert */}
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={clearError} />
            </div>
          )}

          {currentStep === 1 && (
            <div className="mb-6">
              <Alert
                type="info"
                message="Votre demande sera examinée par un administrateur. Vous recevrez un email une fois approuvée."
              />
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={
              currentStep === 1
                ? (e) => {
                    e.preventDefault();
                    handleNextStep();
                  }
                : handleSubmit
            }
            className="space-y-5"
          >
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre
                    </label>
                    <select
                      name="titre"
                      value={formData.titre}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    >
                      <option value="">---</option>
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Ing.">Ing.</option>
                      <option value="Pr.">Pr.</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <Input
                      label="Nom complet"
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      error={formErrors.full_name}
                      required
                    />
                  </div>
                </div>

                <Input
                  label="Email professionnel"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean.dupont@entreprise.com"
                  error={formErrors.email}
                  required
                />

                <Input
                  label="Téléphone"
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+225 XX XX XX XX"
                  error={formErrors.telephone}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200"
                >
                  Continuer
                  <svg
                    className="w-5 h-5 ml-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
              </>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <>
                <Input
                  label="Poste"
                  type="text"
                  name="poste"
                  value={formData.poste}
                  onChange={handleChange}
                  placeholder="Ingénieur Électrique"
                  error={formErrors.poste}
                  required
                />

                <Input
                  label="Entreprise / Organisation"
                  type="text"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleChange}
                  placeholder="SABC"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison de la demande
                  </label>
                  <textarea
                    name="raison_demande"
                    value={formData.raison_demande}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Décrivez brièvement pourquoi vous souhaitez accéder à la plateforme..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none transition-all"
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.raison_demande.length}/500 caractères
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePrevStep}
                    className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 17l-5-5m0 0l5-5m-5 5h12"
                      />
                    </svg>
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200"
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
                        Envoi...
                      </span>
                    ) : (
                      "Envoyer la demande"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* Login link */}
          <div className="relative my-6 sm:my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">
                Déjà inscrit ?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-emerald-600 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors duration-200"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    titre: '',
    poste: '',
    entreprise: '',
    telephone: '',
    raison_demande: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.full_name) {
      errors.full_name = 'Le nom complet est requis';
    } else if (formData.full_name.length < 2) {
      errors.full_name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.poste) {
      errors.poste = 'Le poste est requis';
    }

    if (formData.telephone && !/^[\d\s\-\+\(\)]+$/.test(formData.telephone)) {
      errors.telephone = 'Format de téléphone invalide';
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
      const response = await register(formData);
      setSuccess(true);
      setRegisteredEmail(response.email);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Demande envoyée avec succès !
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Votre demande d'accès a été envoyée à l'administrateur.
                  Vous recevrez un email à <strong>{registeredEmail}</strong> une fois votre compte approuvé.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">
                  📧 Vous recevrez un code OTP par email pour activer votre compte.
                </p>
                <p className="text-gray-600 text-sm">
                  ⏱️ Le traitement prend généralement quelques heures.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Créer un compte
          </h1>
          <p className="text-gray-600">
            Remplissez le formulaire pour demander l'accès
          </p>
        </div>

        {/* Registration Card */}
        <Card>
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={clearError}
            />
          )}

          <Alert
            type="info"
            message="Votre demande sera examinée par un administrateur. Vous recevrez un email une fois approuvée."
          />

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Section 1: Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Informations personnelles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <select
                    name="titre"
                    value={formData.titre}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Ing.">Ing.</option>
                    <option value="Pr.">Pr.</option>
                  </select>
                </div>

                <div className="md:col-span-2">
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
                helperText="Utilisez votre email professionnel"
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
            </div>

            {/* Section 2: Informations professionnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Informations professionnelles
              </h3>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison de la demande
                </label>
                <textarea
                  name="raison_demande"
                  value={formData.raison_demande}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Décrivez brièvement pourquoi vous souhaitez accéder à la plateforme..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.raison_demande.length}/500 caractères
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Vous avez déjà un compte ? Se connecter
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

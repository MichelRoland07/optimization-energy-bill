"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import authService from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

export default function ActivatePage() {
  const router = useRouter();
  const { activate, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [otpResent, setOtpResent] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule');
    }
    if (!/\d/.test(password)) {
      errors.push('Au moins un chiffre');
    }
    return errors;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.otp) {
      errors.otp = 'Le code OTP est requis';
    } else if (formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
      errors.otp = 'Le code OTP doit contenir 6 chiffres';
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors.join(', ');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
      // Redirect handled by store (user will be logged in automatically)
      router.push('/dashboard');
    } catch (err) {
      // Error handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleResendOTP = async () => {
    if (!formData.email) {
      setFormErrors({ email: 'Veuillez entrer votre email d\'abord' });
      return;
    }

    try {
      await authService.resendOTP(formData.email);
      setOtpResent(true);
      setTimeout(() => setOtpResent(false), 5000);
    } catch (err: any) {
      setFormErrors({
        otp: err.response?.data?.detail || 'Erreur lors du renvoi du code OTP'
      });
    }
  };

  const passwordStrength = formData.password ? validatePassword(formData.password) : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Activer votre compte
          </h1>
          <p className="text-gray-600">
            Entrez le code OTP reçu par email
          </p>
        </div>

        {/* Activation Card */}
        <Card>
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
              <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Code d'activation
            </h2>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={clearError}
            />
          )}

          {otpResent && (
            <Alert
              type="success"
              message="Un nouveau code OTP a été envoyé à votre email !"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre.email@exemple.com"
              error={formErrors.email}
              required
              autoComplete="email"
            />

            <div>
              <Input
                label="Code OTP"
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="123456"
                error={formErrors.otp}
                required
                maxLength={6}
                className="text-center text-2xl font-bold tracking-widest"
              />
              <button
                type="button"
                onClick={handleResendOTP}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Vous n'avez pas reçu le code ? Renvoyer
              </button>
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
            />

            {/* Password strength indicator */}
            {formData.password && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Exigences du mot de passe :
                </p>
                <ul className="text-xs space-y-1">
                  <li className={passwordStrength.includes('Au moins 8 caractères') ? 'text-red-600' : 'text-green-600'}>
                    {passwordStrength.includes('Au moins 8 caractères') ? '✗' : '✓'} Au moins 8 caractères
                  </li>
                  <li className={passwordStrength.includes('Au moins une majuscule') ? 'text-red-600' : 'text-green-600'}>
                    {passwordStrength.includes('Au moins une majuscule') ? '✗' : '✓'} Au moins une majuscule
                  </li>
                  <li className={passwordStrength.includes('Au moins une minuscule') ? 'text-red-600' : 'text-green-600'}>
                    {passwordStrength.includes('Au moins une minuscule') ? '✗' : '✓'} Au moins une minuscule
                  </li>
                  <li className={passwordStrength.includes('Au moins un chiffre') ? 'text-red-600' : 'text-green-600'}>
                    {passwordStrength.includes('Au moins un chiffre') ? '✗' : '✓'} Au moins un chiffre
                  </li>
                </ul>
              </div>
            )}

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
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Activation...' : 'Activer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Retour à la connexion
            </Link>
          </div>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">💡 Information</p>
            <ul className="space-y-1 text-xs">
              <li>• Le code OTP est valide pendant 24 heures</li>
              <li>• Vérifiez votre dossier spam si vous ne l'avez pas reçu</li>
              <li>• Une fois activé, vous serez automatiquement connecté</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

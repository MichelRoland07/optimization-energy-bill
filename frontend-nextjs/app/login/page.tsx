"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, user } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in (check only once on mount)
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/pending-requests');
      } else {
        router.push('/dashboard');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
    };

    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
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
      // Force redirect after successful login
      const currentUser = useAuthStore.getState().user;
      console.log('Login successful, user:', currentUser);
      if (currentUser) {
        if (currentUser.role === 'admin') {
          console.log('Redirecting to admin panel');
          router.push('/admin/pending-requests');
        } else {
          console.log('Redirecting to dashboard');
          router.push('/dashboard');
        }
      } else {
        console.error('Login succeeded but no user in store');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Optimisation SABC
          </h1>
          <p className="text-gray-600">
            Plateforme d'analyse énergétique
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Connexion
            </h2>
            <p className="text-gray-600 text-center mt-2">
              Connectez-vous à votre compte
            </p>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={clearError}
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
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Link
                href="/register"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Vous n'avez pas de compte ? S'inscrire
              </Link>
            </div>
          </div>
        </Card>

        {/* Demo credentials */}
        <Card className="bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium mb-2">
              🔑 Compte de démonstration Admin
            </p>
            <div className="bg-white p-3 rounded border border-gray-300 text-sm">
              <p className="text-gray-700">
                <strong>Email:</strong> admin@sabc.com
              </p>
              <p className="text-gray-700">
                <strong>Mot de passe:</strong> Admin@2024
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

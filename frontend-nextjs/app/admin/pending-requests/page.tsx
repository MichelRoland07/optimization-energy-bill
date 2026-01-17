"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import adminService from '@/services/admin.service';
import { PendingUserRequest } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

export default function PendingRequestsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();

  const [requests, setRequests] = useState<PendingUserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [rejectModal, setRejectModal] = useState<{
    show: boolean;
    userId: number | null;
    reason: string;
  }>({
    show: false,
    userId: null,
    reason: '',
  });

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminService.getPendingRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      await adminService.approveRequest(userId);
      setSuccess('Demande approuvée. Un email avec le code OTP a été envoyé à l\'utilisateur.');
      setTimeout(() => setSuccess(''), 5000);
      fetchPendingRequests(); // Refresh list
    } catch (err: any) {
      // Handle error message properly
      let errorMessage = 'Erreur lors de l\'approbation';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
        }
      }
      setError(errorMessage);
    }
  };

  const handleRejectClick = (userId: number) => {
    setRejectModal({
      show: true,
      userId,
      reason: '',
    });
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.userId || !rejectModal.reason.trim()) {
      return;
    }

    try {
      await adminService.rejectRequest(rejectModal.userId, rejectModal.reason);
      setSuccess('Demande rejetée. Un email a été envoyé à l\'utilisateur.');
      setTimeout(() => setSuccess(''), 5000);
      setRejectModal({ show: false, userId: null, reason: '' });
      fetchPendingRequests(); // Refresh list
    } catch (err: any) {
      // Handle error message properly
      let errorMessage = 'Erreur lors du rejet';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
        }
      }
      setError(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Demandes d'accès pendantes
          </h1>
          <p className="mt-2 text-gray-600">
            Gérez les demandes d'accès à la plateforme
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande pendante</h3>
              <p className="mt-1 text-sm text-gray-500">
                Toutes les demandes d'accès ont été traitées.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-lg">
                          {request.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.titre} {request.full_name}
                        </h3>
                        <p className="text-sm text-gray-600">{request.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Poste</p>
                        <p className="text-sm text-gray-900">{request.poste}</p>
                      </div>
                      {request.entreprise && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Entreprise</p>
                          <p className="text-sm text-gray-900">{request.entreprise}</p>
                        </div>
                      )}
                      {request.telephone && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Téléphone</p>
                          <p className="text-sm text-gray-900">{request.telephone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date de demande</p>
                        <p className="text-sm text-gray-900">{formatDate(request.created_at)}</p>
                      </div>
                    </div>

                    {request.raison_demande && (
                      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">Raison de la demande</p>
                        <p className="text-sm text-gray-900">{request.raison_demande}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      variant="success"
                      onClick={() => handleApprove(request.id)}
                      className="whitespace-nowrap"
                    >
                      ✓ Approuver
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleRejectClick(request.id)}
                      className="whitespace-nowrap"
                    >
                      ✕ Rejeter
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rejeter la demande
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Veuillez indiquer la raison du rejet. Cette information sera envoyée à l'utilisateur.
              </p>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                placeholder="Ex: Email non professionnel, informations incomplètes..."
                required
              />
              <div className="mt-6 flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setRejectModal({ show: false, userId: null, reason: '' })}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRejectSubmit}
                  disabled={!rejectModal.reason.trim() || rejectModal.reason.trim().length < 10}
                >
                  Confirmer le rejet
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

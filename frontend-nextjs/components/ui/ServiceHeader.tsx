import React from 'react';
import useDataStore from '@/store/useDataStore';
import { Card } from './Card';

export const ServiceHeader: React.FC = () => {
  const { currentService, dataReady } = useDataStore();

  if (!dataReady || !currentService) {
    return (
      <Card className="mb-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-yellow-800">
            Aucun service sélectionné. Veuillez charger un fichier depuis la page <a href="/dashboard/accueil" className="font-semibold underline">Accueil</a>.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Service en cours d'analyse</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-blue-700 font-medium">N° Service</p>
              <p className="text-blue-900 font-semibold">{currentService.service_no}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Client</p>
              <p className="text-blue-900 font-semibold">{currentService.nom_client}</p>
            </div>
            {currentService.region && (
              <div>
                <p className="text-blue-700 font-medium">Région</p>
                <p className="text-blue-900">{currentService.region}</p>
              </div>
            )}
            {currentService.puissance_souscrite && (
              <div>
                <p className="text-blue-700 font-medium">Puissance</p>
                <p className="text-blue-900">{currentService.puissance_souscrite.toFixed(0)} kW</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

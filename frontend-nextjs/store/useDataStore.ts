/**
 * Zustand store for data/service state management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ServiceData {
  service_no: string;
  nom_client: string;
  region?: string;
  division?: string;
  agence?: string;
  puissance_souscrite?: number;
}

interface ServiceInfo {
  service_no: string;
  nom_client: string;
  region: string;
  division: string;
  agence: string;
  puissance_souscrite: number;
  puissance_max_atteinte: number;
  nb_depassements: number;
  penalites_cosphi_2025: number;
  nb_lignes: number;
}

interface DataState {
  // Current selected service
  currentService: ServiceData | null;

  // Data ready flag
  dataReady: boolean;

  // Multi-service mode
  isMultiService: boolean;

  // All available services (for multi-service files)
  availableServices: ServiceInfo[];

  // Actions
  setCurrentService: (service: ServiceData) => void;
  setDataReady: (ready: boolean) => void;
  setMultiService: (isMulti: boolean) => void;
  setAvailableServices: (services: ServiceInfo[]) => void;
  clearData: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      currentService: null,
      dataReady: false,
      isMultiService: false,
      availableServices: [],

      setCurrentService: (service: ServiceData) => {
        set({
          currentService: service,
          dataReady: true
        });
      },

      setDataReady: (ready: boolean) => {
        set({ dataReady: ready });
      },

      setMultiService: (isMulti: boolean) => {
        set({ isMultiService: isMulti });
      },

      setAvailableServices: (services: ServiceInfo[]) => {
        set({ availableServices: services });
      },

      clearData: () => {
        set({
          currentService: null,
          dataReady: false,
          isMultiService: false,
          availableServices: []
        });
      },
    }),
    {
      name: 'data-storage', // name of the item in localStorage
    }
  )
);

export default useDataStore;

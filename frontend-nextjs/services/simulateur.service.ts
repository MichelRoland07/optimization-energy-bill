/**
 * Simulateur service - API calls for tariff simulator
 */
import api from '@/lib/api';

/**
 * Response from tableau-tarifs endpoint
 */
export interface TableauTarifsResponse {
  annee: number;
  colonnes: string[];
  lignes: Array<Record<string, any>>;
}

/**
 * Request for simulation
 */
export interface SimulationRequest {
  puissance: number;
  temps_fonctionnement: number;
  annee: number;
}

/**
 * Response from simulate endpoint
 */
export interface SimulationResponse {
  type: number;
  categorie: string;
  plage_horaire: string;
  intervalle_min: number;
  intervalle_max: number;
  tarif_off_peak: number;
  tarif_peak: number;
  prime_fixe: number;
  coefficient: number;
  puissance: number;
  temps_fonctionnement: number;
  annee: number;
}

export const simulateurService = {
  /**
   * Get complete tariffs table for a given year
   */
  async getTableauTarifs(annee: number = 2025): Promise<TableauTarifsResponse> {
    const response = await api.get<TableauTarifsResponse>('/api/simulateur/tableau-tarifs', {
      params: { annee }
    });
    return response.data;
  },

  /**
   * Simulate tariffs for given power and operating time
   */
  async simulate(request: SimulationRequest): Promise<SimulationResponse> {
    const response = await api.post<SimulationResponse>('/api/simulateur/simulate', request);
    return response.data;
  },
};

export default simulateurService;

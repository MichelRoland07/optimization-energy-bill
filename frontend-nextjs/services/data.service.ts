/**
 * Data service - API calls for data operations
 */
import api from '@/lib/api';

export interface ProfilClientResponse {
  // Section 1: Administrative Profile (5 fields)
  infos_administratives: {
    nom_client: string;
    service_no: string;
    region: string;
    division: string;
    agence: string;
    annees_disponibles: number[];
  };

  // Section 2: Energetic Profile Summary (6 tables for selected year)
  profil_energetique: {
    annee: number;
    tableau1: any;        // Contractual characteristics
    tableau1bis: any;     // N+1 projection (optional)
    tableau2: any;        // Power reached
    tableau3: any;        // Consumption
    tableau4: any;        // Billing
    tableau5: any;        // Cos φ (optional)
    tableau6: any;        // Cos φ penalty (optional)
  };

  // Section 3: Consumption Profile (multi-year analysis)
  profil_consommation: {
    graph1_evolution: any;              // Multi-year consumption evolution
    tableau_variation_conso: any;       // Year-over-year consumption variations
    graph2_hc_hp_facturation: any;      // Stacked HC/HP + billing line
    tableau_variation_facturation: any; // Billing variations
    tableau_prix_unitaire: any;         // Unit price analysis
    tableau_recapitulatif: any;         // Annual statistics summary
  };
}

export interface ReconstitutionResponse {
  year: number;
  nom_client: string;
  service_no: string;
  annees_disponibles: number[];
  metriques_globales: {
    facture_reelle_total: number;
    facture_calculee_total: number;
    gap_total: number;
    nb_depassements: number;
  };
  tableau_mensuel: Array<{
    mois: string;
    puissance_souscrite: number;
    puissance_atteinte: number;
    depassement: number;
    type_tarifaire: number;
    facture_reelle: number;
    facture_calculee: number;
    ecart: number;
  }>;
  graph_comparaison: {
    x: string[];
    y_reelle: number[];
    y_calculee: number[];
    type: string;
    title: string;
    xaxis_title: string;
    yaxis_title: string;
  };
  graph_ecarts: {
    x: string[];
    y: number[];
    type: string;
    title: string;
    xaxis_title: string;
    yaxis_title: string;
  };
}

export const dataService = {
  /**
   * Get client profile
   */
  async getProfilClient(year?: number): Promise<ProfilClientResponse> {
    const params = year ? { year } : {};
    const response = await api.get<ProfilClientResponse>('/api/data/profil', { params });
    return response.data;
  },

  /**
   * Get synthesis table
   */
  async getSynthese(year: number): Promise<any> {
    const response = await api.get(`/api/data/synthese`, { params: { year } });
    return response.data;
  },

  /**
   * Get graphiques data
   */
  async getGraphiques(year: number): Promise<any> {
    const response = await api.get(`/api/data/graphiques`, { params: { year } });
    return response.data;
  },

  /**
   * Get reconstitution data
   */
  async getReconstitution(year: number): Promise<ReconstitutionResponse> {
    const response = await api.get<ReconstitutionResponse>('/api/data/reconstitution', { params: { year } });
    return response.data;
  },
};

export default dataService;

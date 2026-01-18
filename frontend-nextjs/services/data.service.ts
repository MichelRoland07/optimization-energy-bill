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
    gap_pct: number;
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
    text: string[];
    type: string;
    title: string;
    xaxis_title: string;
    yaxis_title: string;
  };
  graph_decomposition: {
    x: string[];
    y_hc: number[];
    y_hp: number[];
    y_prime: number[];
    type: string;
    title: string;
    xaxis_title: string;
    yaxis_title: string;
  };
}

export interface TarifsInfo {
  type_tarifaire: number;
  categorie: string;
  plage_horaire: string;
  intervalle_min: number;
  intervalle_max: number;
  tableau_tarifs: Array<{
    temps_fonctionnement: string;
    tarif_hc: number;
    tarif_hp: number;
    prime_fixe: number;
  }>;
}

export interface OptimisationInitResponse {
  year: number;
  annee_N_plus_1: number;
  nom_client: string;
  service_no: string;
  annees_disponibles: number[];
  config_actuelle: {
    puissance_actuelle: number;
    puissance_max: number;
    type_actuel: number;
    cout_annuel: number;
    nb_depassements: number;
  };
  stats_puissance: {
    min: number;
    max: number;
    moyenne: number;
  };
  tarifs_actuels: TarifsInfo;
}

export interface OptimisationSimulationResponse {
  year: number;
  annee_N_plus_1: number;
  nouvelle_puissance: number;
  type_optimise: number;
  info_nouvelle_puissance: {
    type_optimise: number;
    type_actuel: number;
    type_change: string;
    intervalle_min: number;
    intervalle_max: number;
    delta_puissance: number;
    alerte_depassement: any;
  };
  tarifs_nouvelle_puissance: TarifsInfo;
  resultats_simulation: {
    metriques_financieres: {
      cout_actuel: number;
      cout_optimise: number;
      economie_annuelle: number;
      economie_pct: number;
      economie_mensuelle: number;
    };
    metriques_depassements: {
      nb_depassements_actuel: number;
      nb_depassements_optimise: number;
      delta_depassements: number;
    };
    alerte_economie: any;
    graph_factures: {
      x: string[];
      y_actuelle: number[];
      y_simulee: number[];
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    graph_economies: {
      x: string[];
      y: number[];
      text: string[];
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    tableau_mensuel: Array<{
      mois: string;
      puissance_atteinte: number;
      facture_actuelle: number;
      facture_simulee: number;
      economie: number;
      depassement_actuel: boolean;
      depassement_simule: boolean;
    }>;
    tableau_synthese: Array<Record<string, any>> | null;
  };
  resultats_projection: {
    metriques_projection: {
      cout_N: number;
      cout_N_plus_1: number;
      augmentation_annuelle: number;
      augmentation_pct: number;
      augmentation_mensuelle: number;
      nb_depassements: number;
    };
    graph_factures: {
      x: string[];
      y_N: number[];
      y_N_plus_1: number[];
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    graph_augmentations: {
      x: string[];
      y: number[];
      text: string[];
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    tableau_mensuel: Array<{
      mois: string;
      puissance_atteinte: number;
      facture_N: number;
      facture_N_plus_1: number;
      augmentation: number;
      depassement: boolean;
    }>;
    tarifs_N_plus_1: TarifsInfo;
    tableau_synthese: Array<Record<string, any>> | null;
  };
  resultats_optimisation_N_plus_1: {
    metriques_optimisation: {
      cout_N: number;
      cout_N_plus_1_actuelle: number;
      cout_N_plus_1_optimisee: number;
      economie_vs_projection: number;
      economie_vs_projection_pct: number;
      economie_vs_N: number;
      economie_vs_N_pct: number;
      nb_depassements: number;
    };
    graph_factures: {
      x: string[];
      y_N: number[];
      y_N_plus_1_actuelle: number[];
      y_N_plus_1_optimisee: number[];
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    graph_economies: {
      x: string[];
      y: number[];
      text: string[];
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    tableau_mensuel: Array<{
      mois: string;
      puissance_atteinte: number;
      facture_N: number;
      facture_N_plus_1_actuelle: number;
      facture_N_plus_1_optimisee: number;
      economie_vs_projection: number;
      economie_vs_N: number;
      depassement: boolean;
    }>;
    tarifs_N_plus_1_optimise: TarifsInfo;
    tableau_synthese: Array<Record<string, any>> | null;
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
   * If year is not provided, backend will use the most recent year
   */
  async getReconstitution(year?: number): Promise<ReconstitutionResponse> {
    const params = year ? { year } : {};
    const response = await api.get<ReconstitutionResponse>('/api/data/reconstitution', { params });
    return response.data;
  },

  /**
   * Get optimisation init data
   * If year is not provided, backend will use the most recent year
   */
  async getOptimisationInit(year?: number): Promise<OptimisationInitResponse> {
    const params = year ? { year } : {};
    const response = await api.get<OptimisationInitResponse>('/api/data/optimisation/init', { params });
    return response.data;
  },

  /**
   * Simulate with new power
   */
  async postOptimisationSimulate(year: number, nouvelle_puissance: number): Promise<OptimisationSimulationResponse> {
    const response = await api.post<OptimisationSimulationResponse>('/api/data/optimisation/simulate', {
      year,
      nouvelle_puissance
    });
    return response.data;
  },
};

export default dataService;

/**
 * Data service - API calls for data operations
 */
import api from '@/lib/api';

export interface ProfilClientResponse {
  infos_administratives: {
    nom_client: string;
    service_no: string;
    region: string;
    division: string;
    agence: string;
    annees_disponibles: number[];
  };
  profil_energetique: {
    annee_selectionnee: number;
    puissance_souscrite: number;
    puissance_max: number;
    puissance_min: number;
    puissance_moyenne: number;
    consommation_max: number;
    consommation_min: number;
    consommation_moyenne: number;
    conso_hc_moyenne: number;
    conso_hp_moyenne: number;
    ratio_hc: number;
    ratio_hp: number;
    type_tarifaire: number;
    categorie: string;
    plage_horaire: string;
    tarif_hc: number;
    tarif_hp: number;
    prime_fixe: number;
    annee_tarifs: number;
    cosphi?: {
      disponible: boolean;
      moyen: number;
      min: number;
      max: number;
      nb_mois_sous_seuil: number;
    };
  };
  profil_consommation: {
    annees: number[];
    series_consommation: Array<{
      annee: number;
      mois: number[];
      consommation: number[];
    }>;
    series_puissance: Array<{
      annee: number;
      mois: number[];
      puissance: number[];
    }>;
  };
  graphiques_profil_energetique?: {
    annee: number;
    graph_factures: {
      x: string[];
      y: number[];
      type: string;
      name: string;
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    graph_puissances: {
      x: string[];
      y_atteinte: number[];
      y_souscrite: number[];
      type: string;
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
    graph_cosphi?: {
      x: string[];
      y: number[];
      y_seuil: number[];
      type: string;
      title: string;
      xaxis_title: string;
      yaxis_title: string;
    };
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
};

export default dataService;

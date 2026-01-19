export interface ServiceInfo {
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

export interface UploadResponse {
  single_service: boolean;
  service_no?: string;
  nom_client?: string;
  services?: ServiceInfo[];
  data_ready: boolean;
}

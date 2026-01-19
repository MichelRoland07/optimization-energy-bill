// Types matching backend response
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
    annee: number;
    tableau1: any;
    tableau1bis: any | null;
    tableau2: any;
    tableau3: any;
    tableau4: any;
    tableau5: any | null;
    tableau6: any | null;
  };
  profil_consommation: {
    graph1_evolution: {
      series: Array<{
        annee: number;
        mois: number[];
        consommation: number[];
      }>;
    };
    tableau_variation_conso: Array<{
      annee: number;
      consommation: number;
      variation?: number;
    }>;
    graph2_hc_hp_facturation: {
      annees: number[];
      hc: number[];
      hp: number[];
      facturation: number[];
    };
    tableau_variation_facturation: Array<{
      annee: number;
      facturation: number;
      variation?: number;
    }>;
    tableau_prix_unitaire: Array<{
      annee: number;
      consommation: number;
      facturation: number;
      prix_unitaire: number;
    }>;
    tableau_recapitulatif: Array<{
      annee: number;
      consommation_totale: string;
      consommation_moyenne: string;
      heures_creuses: string;
      heures_pointe: string;
      mois_consommation_max: string;
      facturation_totale: string;
    }>;
  };

}

export type TabType = "profil" | "resume" | "consommation" | "synthese";

// Pagination Component
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface PaginatedTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  itemsPerPage?: number;
}

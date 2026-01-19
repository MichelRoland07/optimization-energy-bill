import { Card } from "@/components/ui/Card";
import { User } from "lucide-react";
import React from "react";

export default function ProfilePage({
  infos_administratives,
}: {
  infos_administratives: {
    nom_client: string;
    service_no: string;
    region: string;
    division: string;
    agence: string;
    annees_disponibles: number[];
  };
}) {
  return (
    <div>
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-6 h-6 text-emerald-700" />
          <h2 className="text-xl font-semibold text-emerald-900">
            Profil du client
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 mb-1">
              Nom du client:
            </p>
            <p className="text-base text-gray-900 font-semibold break-words">
              {infos_administratives.nom_client}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 mb-1">
              N° de service:
            </p>
            <p className="text-base text-gray-900 font-semibold">
              {infos_administratives.service_no}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 mb-1">Région:</p>
            <p className="text-base text-gray-900 font-semibold">
              {infos_administratives.region}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 mb-1">
              Division:
            </p>
            <p className="text-base text-gray-900 font-semibold">
              {infos_administratives.division}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 mb-1">Agence:</p>
            <p className="text-base text-gray-900 font-semibold">
              {infos_administratives.agence}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

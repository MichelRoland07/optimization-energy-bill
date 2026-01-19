"use client";

import { useState } from "react";
import useAuthStore from "@/store/useAuthStore";
import axios from "axios";
import {
  Upload,
  FileSpreadsheet,
  User,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Zap,
  FileText,
  TrendingUp,
  X,
  Trash,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AccueilPage() {
  const { user, hasPermission } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const canUpload = hasPermission("upload_data");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".xls")
      ) {
        setError("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
        return;
      }
      setFile(selectedFile);
      setError("");
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    if (!canUpload) {
      setError("Vous n'avez pas la permission de télécharger des fichiers");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${API_BASE_URL}/api/data/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUploadSuccess(true);
      setUploadedFileName(file.name);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Erreur lors du téléchargement du fichier",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (
        !droppedFile.name.endsWith(".xlsx") &&
        !droppedFile.name.endsWith(".xls")
      ) {
        setError("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
        return;
      }
      setFile(droppedFile);
      setError("");
      setUploadSuccess(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenue, {user?.titre} {user?.full_name}
            </h1>
            <p className="text-emerald-100 mt-1">
              Téléchargez vos données de consommation pour commencer l'analyse
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Erreur</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900">Succès</p>
            <p className="text-sm text-emerald-700 mt-1">
              Fichier "{uploadedFileName}" téléchargé avec succès !
            </p>
          </div>
          <button
            onClick={() => setUploadSuccess(false)}
            className="text-emerald-400 hover:text-emerald-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Upload Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Télécharger les données
            </h2>
            <p className="text-gray-600">Format accepté: Excel (.xlsx, .xls)</p>
          </div>

          {!canUpload && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">
                    Permission requise
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Vous n'avez pas la permission de télécharger des fichiers.
                    Veuillez contacter un administrateur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              file
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
            } ${!canUpload ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={!canUpload}
            />

            {file ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    const fileInput = document.getElementById(
                      "file-upload",
                    ) as HTMLInputElement;
                    if (fileInput) fileInput.value = "";
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
                >
                  Supprimer le fichier{" "}
                  <Trash className="inline-block w-4 h-4 ml-1" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className={canUpload ? "cursor-pointer" : "cursor-not-allowed"}
              >
                <div className="mx-auto w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base text-gray-700 mb-2">
                  <span className="font-semibold text-emerald-600">
                    Cliquez pour sélectionner
                  </span>{" "}
                  ou glissez-déposez
                </p>
                <p className="text-sm text-gray-500">
                  Fichiers Excel uniquement (.xlsx, .xls)
                </p>
              </label>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={!canUpload || isUploading}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                  canUpload && !isUploading
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Téléchargement en cours...
                  </span>
                ) : (
                  "Télécharger le fichier"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-blue-900 mb-3">
              Instructions d'utilisation
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Le fichier Excel doit contenir les colonnes: READING_DATE,
                  CONSUMPTION_KWH, PUISSANCE_SOUSCRITE
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Les dates doivent être au format DD/MM/YYYY</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>La consommation doit être en kWh</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>La puissance souscrite en kVA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Après le téléchargement, vous pourrez accéder aux analyses
                  dans les autres sections
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

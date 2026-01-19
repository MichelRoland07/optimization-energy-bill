"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import useAuthStore from "@/store/useAuthStore";
import useDataStore from "@/store/useDataStore";
import axios from "axios";
import Table from "./components/Table";
import { UploadResponse } from "./components/acceuil_interface";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AccueilPage() {
  const { user, hasPermission } = useAuthStore();
  const {
    currentService,
    isMultiService,
    availableServices,
    setCurrentService,
    setDataReady,
    setMultiService,
    setAvailableServices,
    clearData,
  } = useDataStore();

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null,
  );
  const [selectedService, setSelectedService] = useState<string>("");
  const [isSelectingService, setIsSelectingService] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  const canUpload = hasPermission("upload_data");

  // Required columns
  const requiredColumns = [
    "READING_DATE",
    "SERVICE_NO",
    "CUST_NAME",
    "REGION",
    "SUBSCRIPTION_LOAD",
    "MV_CONSUMPTION",
    "OFF_PEAK_CONSUMPTION",
    "PEAK_CONSUMPTION",
    "AMOUNT_WITHOUT_TAX",
    "TVA",
    "AMOUNT_WITH_TAX",
  ];

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
    setUploadResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("access_token");
      const response = await axios.post<UploadResponse>(
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
      setUploadResponse(response.data);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Store service data in global store
      if (
        response.data.single_service &&
        response.data.service_no &&
        response.data.nom_client
      ) {
        // Single service: store immediately
        setCurrentService({
          service_no: response.data.service_no,
          nom_client: response.data.nom_client,
        });
        setDataReady(true);
        setMultiService(false);
        setAvailableServices([]);
        setTimeout(() => setUploadSuccess(false), 5000);
      } else if (response.data.services) {
        // Multi-service: store services list and wait for selection
        setMultiService(true);
        setAvailableServices(response.data.services);
        setDataReady(false);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Erreur lors du téléchargement du fichier",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleServiceSelection = async () => {
    if (!selectedService) {
      setError("Veuillez sélectionner un service");
      return;
    }

    setIsSelectingService(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE_URL}/api/data/select-service`,
        { service_no: selectedService },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Update upload response to mark data as ready
      const selectedServiceInfo = availableServices.find(
        (s) => s.service_no === selectedService,
      );

      if (uploadResponse) {
        setUploadResponse({
          ...uploadResponse,
          data_ready: true,
          service_no: selectedService,
          nom_client: selectedServiceInfo?.nom_client || "",
        });
      }

      // Store selected service in global store
      if (selectedServiceInfo) {
        setCurrentService({
          service_no: selectedServiceInfo.service_no,
          nom_client: selectedServiceInfo.nom_client,
          region: selectedServiceInfo.region,
          division: selectedServiceInfo.division,
          agence: selectedServiceInfo.agence,
          puissance_souscrite: selectedServiceInfo.puissance_souscrite,
        });
        setDataReady(true);
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Erreur lors de la sélection du service",
      );
    } finally {
      setIsSelectingService(false);
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
    <div className="p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg mb-5">
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
        {/* Current Service Info */}
        {currentService && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <svg
                  className="h-6 w-6 text-green-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-green-900 mb-2">
                    Service actuellement sélectionné
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-green-700">N° Service</p>
                      <p className="text-green-900 font-semibold">
                        {currentService.service_no}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700">Client</p>
                      <p className="text-green-900 font-semibold">
                        {currentService.nom_client}
                      </p>
                    </div>
                    {currentService.region && (
                      <div>
                        <p className="text-green-700">Région</p>
                        <p className="text-green-900">
                          {currentService.region}
                        </p>
                      </div>
                    )}
                    {currentService.puissance_souscrite && (
                      <div>
                        <p className="text-green-700">Puissance</p>
                        <p className="text-green-900">
                          {currentService.puissance_souscrite.toFixed(0)} kW
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  clearData();
                  setUploadResponse(null);
                  setSelectedService("");
                }}
                className="ml-4"
              >
                Charger un autre fichier
              </Button>
            </div>
          </Card>
        )}

        {/* Alerts */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {uploadSuccess && (
          <Alert
            type="success"
            message={`Fichier "${uploadedFileName}" téléchargé avec succès !`}
            onClose={() => setUploadSuccess(false)}
          />
        )}

        {/* Upload Card */}
        <Card>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Télécharger les données
            </h2>
            <p className="text-gray-600 mb-6">
              Format accepté: Excel (.xlsx, .xls)
            </p>
          </div>

          {!canUpload && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-600 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Permission requise
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
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
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              file
                ? "border-primary-400 bg-primary-50"
                : "border-gray-300 hover:border-primary-400"
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
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                  <svg
                    className="h-6 w-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => {
                    setFile(null);
                    const fileInput = document.getElementById(
                      "file-upload",
                    ) as HTMLInputElement;
                    if (fileInput) fileInput.value = "";
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className={canUpload ? "cursor-pointer" : "cursor-not-allowed"}
              >
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-primary-600">
                    Cliquez pour sélectionner
                  </span>{" "}
                  ou glissez-déposez
                </p>
                <p className="text-xs text-gray-500">
                  Fichiers Excel uniquement (.xlsx, .xls)
                </p>
              </label>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={handleUpload}
                isLoading={isUploading}
                disabled={!canUpload}
                className="w-full"
              >
                {isUploading
                  ? "Téléchargement en cours..."
                  : "Télécharger le fichier"}
              </Button>
            </div>
          )}
        </Card>

        {/* Upload Statistics - Show after successful upload */}
        {uploadSuccess && uploadResponse && uploadResponse.single_service && (
          <Card className="mt-6 bg-green-50 border-green-200">
            <div className="flex items-start">
              <svg
                className="h-6 w-6 text-green-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-900 mb-2">
                  Données chargées avec succès
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">
                      Service:{" "}
                      <span className="font-semibold">
                        {uploadResponse.service_no}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700">
                      Client:{" "}
                      <span className="font-semibold">
                        {uploadResponse.nom_client}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Multi-Service Dashboard */}
        {isMultiService && availableServices.length > 0 && (
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Vue sur les entreprises enregistrées
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Votre fichier contient {availableServices.length} services
              différents.
            </p>

            <Table
              availableServices={availableServices}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
            />

            {/* Service Selection Section */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choisissez l'entreprise à analyser :
              </label>
              <div className="flex gap-3">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="">-- Choisir un service --</option>
                  {availableServices.map((service) => (
                    <option key={service.service_no} value={service.service_no}>
                      {service.service_no} - {service.nom_client} -{" "}
                      {service.region}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  onClick={handleServiceSelection}
                  isLoading={isSelectingService}
                  disabled={!selectedService}
                >
                  🔄 Charger cette entreprise
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Show success message after service selection */}
        {uploadResponse &&
          uploadResponse.data_ready &&
          !uploadResponse.single_service && (
            <Card className="mt-6 bg-green-50 border-green-200">
              <div className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-600 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-900 mb-2">
                    Service sélectionné avec succès
                  </h3>
                  <p className="text-sm text-green-700">
                    Vous pouvez maintenant accéder aux analyses pour le service{" "}
                    <span className="font-semibold">
                      {uploadResponse.service_no}
                    </span>{" "}
                    - {uploadResponse.nom_client}
                  </p>
                </div>
              </div>
            </Card>
          )}
      </div>
    </div>
  );
}

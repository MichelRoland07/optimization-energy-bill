import { Button } from "@/components/ui/Button";
import Link from "next/link";
import React from "react";

function Verification({ registeredEmail }: { registeredEmail: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 sm:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Demande envoyée avec succès !
            </h2>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-6 text-left rounded-r-lg">
              <p className="text-sm text-emerald-800">
                Votre demande d'accès a été envoyée à l'administrateur. Vous
                recevrez un email à{" "}
                <strong className="font-semibold">{registeredEmail}</strong> une
                fois votre compte approuvé.
              </p>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-start space-x-3 text-left">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm flex-1">
                  Vous recevrez un code OTP par email pour activer votre compte.
                </p>
              </div>
              <div className="flex items-start space-x-3 text-left">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm flex-1">
                  Le traitement prend généralement quelques heures.
                </p>
              </div>
            </div>
            <Link href="/login">
              <Button
                variant="primary"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              >
                Retour à la connexion
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Verification;

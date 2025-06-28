"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { AlertTriangle, Droplet, Gauge, Eye, AlertOctagon } from "lucide-react"

const alertes = [
  {
    icon: <AlertTriangle className="text-yellow-500 h-7 w-7" />,
    title: "Améliorer la conductivité",
    type: "Avertissement",
    color: "border-yellow-400 bg-yellow-50",
    role: "Ajuster la concentration totale en sel dans l'organisme du patient.",
    actions: [
      "Régler la conductivité entre 138 et 145 mmol/l avant le démarrage de l'appareil."
    ]
  },
  {
    icon: <Droplet className="text-blue-500 h-7 w-7" />,
    title: "Fuite d'air",
    type: "Alarme liée au sang ou au circuit patient",
    color: "border-blue-400 bg-blue-50",
    role: "Détecter la présence de bulles d'air ou un blocage dans le circuit veineux.",
    actions: [
      "Vérifier le piège à bulles veineux.",
      "Contrôler le détecteur d'air : propreté, fermeture correcte de la porte, et bon niveau de sang."
    ]
  },
  {
    icon: <Gauge className="text-purple-500 h-7 w-7" />,
    title: "Alarmes de pression au niveau de la membrane",
    type: "Alarmes de pression",
    color: "border-purple-400 bg-purple-50",
    role: "Contrôler et ajuster la pression transmembranaire.",
    actions: [
      "Contrôler les clamps et les lignes.",
      "Identifier un éventuel blocage ou une mauvaise position du circuit."
    ]
  },
  {
    icon: <Eye className="text-green-600 h-7 w-7" />,
    title: "Évaluation de la coagulation des fibres",
    type: "Étape de surveillance (pas une alarme)",
    color: "border-green-400 bg-green-50",
    role: "Vérifier l'état des fibres capillaires du dialyseur.",
    actions: [
      "Effectuer un rinçage en prédilution (~100 ml).",
      "Si fibres coagulées → effectuer une restauration.",
      <>
        Si fibres intactes → ajuster les paramètres :
        <ul className="list-disc pl-6">
          <li>Réduire la post-dilution</li>
          <li>Augmenter la prédilution</li>
          <li>Passer à la dialyse seule</li>
        </ul>
      </>,
      "Viser un Filtration Fraction (FF) ≤ 20 %."
    ]
  },
  {
    icon: <AlertOctagon className="text-red-500 h-7 w-7" />,
    title: "Fuite de sang",
    type: "Alarme de fuite de sang",
    color: "border-red-400 bg-red-50",
    role: "Détecter une fuite de sang au niveau du dialyseur (sang dans l'ultrafiltrat ou dialysat rosé).",
    actions: [
      "Nettoyer le capteur de fuite de sang.",
      "Repositionner les chambres pour assurer un alignement correct."
    ]
  }
]

export default function AlertsPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "technician") {
      router.push("/login")
      return
    }
    setUser(parsedUser)
    setIsLoading(false)
  }, [router])

  if (!user || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-0 w-full">
      <div className="w-full">
        <Navbar userRole={user.role} userName={user.name} />
      </div>
      <div className="w-full flex flex-col justify-start py-10">
        <h1 className="text-4xl font-extrabold mb-2 text-center text-blue-900 drop-shadow">Alertes et Étapes de Surveillance</h1>
        <p className="mb-8 text-lg text-gray-700 text-center w-full">
          Retrouvez ici les principales alertes et actions à effectuer pour la sécurité et le bon fonctionnement des machines.
        </p>
        <div className="w-full space-y-8">
          {alertes.map((a, idx) => (
            <div
              key={idx}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-8 ${a.color} rounded-lg shadow p-6 w-full`}
            >
              <div className="flex-shrink-0">{a.icon}</div>
              <div>
                <h2 className="text-xl font-bold text-blue-800 mb-1">{idx + 1}. {a.title}</h2>
                <div className="mb-1"><span className="font-semibold">Rôle :</span> {a.role}</div>
                <div className="mb-1"><span className="font-semibold">Type de message :</span> {a.type}</div>
                <div className="mb-1">
                  <span className="font-semibold">Action requise :</span>
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    {a.actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

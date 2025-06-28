"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, CheckCircle, FileText } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"

export default function PatientDashboard() {
  const [user, setUser] = useState(null)
  const [faults, setFaults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "patient") {
      router.push("/login")
      return
    }

    setUser(parsedUser)
    loadFaults(parsedUser.patientId)
  }, [router])

  const loadFaults = async (patientId) => {
    try {
      const faultsData = await api.getFaults(patientId)
      setFaults(faultsData)
    } catch (error) {
      console.error("Error loading faults:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>
  }

  const recentFaults = faults.slice(0, 3)
  const resolvedFaults = faults.filter((f) => f.status === "Resolved").length
  const totalDowntime = faults.reduce((acc, f) => acc + Number.parseFloat(f.downtime.replace(" hours", "")), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Patient</h1>
          <p className="text-gray-600">Surveillez le statut de votre machine de dialyse et l'historique</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des Pannes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{faults.length}</div>
              <p className="text-xs text-muted-foreground">Incidents enregistrés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problèmes Résolus</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedFaults}</div>
              <p className="text-xs text-muted-foreground">Résolus avec succès</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps d'Arrêt Total</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDowntime}h</div>
              <p className="text-xs text-muted-foreground">Temps machine hors ligne</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pannes Récentes</CardTitle>
              <CardDescription>Derniers incidents de machine affectant votre traitement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFaults.map((fault) => (
                  <div key={fault.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{fault.faultType}</p>
                      <p className="text-sm text-gray-600">{fault.date}</p>
                    </div>
                    <Badge variant={fault.status === "Resolved" ? "default" : "destructive"}>
                      {fault.status === "Resolved" ? "Résolu" : fault.status}
                    </Badge>
                  </div>
                ))}
                {recentFaults.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aucune panne récente enregistrée</p>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/dashboard/patient/faults")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Voir l'Historique Complet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut du Traitement</CardTitle>
              <CardDescription>Informations actuelles sur la machine et le traitement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Machine Assignée :</span>
                  <span className="text-sm">Fresenius 4008S</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Dernier Traitement :</span>
                  <span className="text-sm">20 Juin 2025</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Prochain Traitement :</span>
                  <span className="text-sm">22 Juin 2025</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Statut de la Machine :</span>
                  <Badge variant="default" className="bg-green-500">
                    Actif
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

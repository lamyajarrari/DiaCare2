"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, CheckCircle, AlertTriangle, Info } from "lucide-react"
import Navbar from "@/components/layout/navbar"
import api from "@/lib/api"

export default function TestNotificationsInterventionPage() {
  const [user, setUser] = useState(null)
  const [interventions, setInterventions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [testResults, setTestResults] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [interventionsData, alertsData] = await Promise.all([
        api.getInterventions(),
        api.getAlerts()
      ])
      
      setInterventions(interventionsData)
      setAlerts(alertsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const runTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-notifications-intervention', {
        method: 'POST'
      })
      const result = await response.json()
      setTestResults(result)
      await loadData() // Recharger les données
    } catch (error) {
      console.error("Error running test:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAlerts = async () => {
    try {
      const response = await fetch('/api/check-3min-controls', {
        method: 'POST'
      })
      const result = await response.json()
      setTestResults(result)
      await loadData() // Recharger les données
    } catch (error) {
      console.error("Error checking alerts:", error)
    }
  }

  const checkInterventionAlerts = async () => {
    try {
      const response = await fetch('/api/check-intervention-alerts', {
        method: 'POST'
      })
      const result = await response.json()
      setTestResults(result)
      await loadData() // Recharger les données
    } catch (error) {
      console.error("Error checking intervention alerts:", error)
    }
  }

  const getNotificationBadge = (notifications) => {
    if (!notifications) return null
    
    const colors = {
      "3min": "bg-red-100 text-red-800",
      "3months": "bg-blue-100 text-blue-800",
      "6months": "bg-green-100 text-green-800",
      "1year": "bg-purple-100 text-purple-800"
    }
    
    return (
      <Badge className={colors[notifications] || "bg-gray-100 text-gray-800"}>
        {notifications}
      </Badge>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getAlertIcon = (priority) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar userRole={user?.role} userName={user?.name} />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user?.role} userName={user?.name} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Test des Interventions avec Notifications</h1>
          <p className="text-gray-600">Testez le système de notifications de rappel pour les interventions</p>
        </div>

        {/* Boutons de test */}
        <div className="mb-6 flex gap-4">
          <Button onClick={runTest} disabled={isLoading} className="bg-teal-500 hover:bg-teal-600">
            🧪 Créer Interventions de Test
          </Button>
          <Button onClick={checkAlerts} disabled={isLoading} variant="outline">
            🔍 Vérifier Alertes 3min
          </Button>
          <Button onClick={checkInterventionAlerts} disabled={isLoading} variant="outline">
            🔍 Vérifier Alertes d'Intervention
          </Button>
          <Button onClick={loadData} disabled={isLoading} variant="outline">
            🔄 Actualiser
          </Button>
        </div>

        {/* Résultats du test */}
        {testResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Résultats du Test</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interventions avec notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Interventions avec Notifications
                <Badge variant="secondary">{interventions.filter(i => i.notifications).length}</Badge>
              </CardTitle>
              <CardDescription>
                Interventions créées avec des notifications de rappel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interventions.filter(i => i.notifications).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune intervention avec notifications trouvée
                </p>
              ) : (
                <div className="space-y-4">
                  {interventions
                    .filter(i => i.notifications)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((intervention) => (
                      <div key={intervention.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(intervention.status)}
                            <span className="font-medium">#{intervention.id}</span>
                            {getNotificationBadge(intervention.notifications)}
                          </div>
                          <Badge variant={intervention.status === "Completed" ? "default" : "secondary"}>
                            {intervention.status}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-1">{intervention.requestedIntervention}</h4>
                        <p className="text-sm text-gray-600 mb-2">{intervention.equipmentDescription}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Département:</span>
                            <span className="ml-1">{intervention.department}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Technicien:</span>
                            <span className="ml-1">{intervention.technician || "Non assigné"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-1">{intervention.interventionType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-1">{new Date(intervention.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {intervention.datePerformed && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                            <span className="text-green-700">✅ Effectuée le: {new Date(intervention.datePerformed).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertes générées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚠️ Alertes Générées
                <Badge variant="secondary">{alerts.length}</Badge>
              </CardTitle>
              <CardDescription>
                Alertes créées automatiquement selon les notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune alerte trouvée
                </p>
              ) : (
                <div className="space-y-4">
                  {alerts
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getAlertIcon(alert.priority)}
                            <span className="font-medium">{alert.title}</span>
                          </div>
                          <Badge 
                            variant={alert.priority === "critical" ? "destructive" : 
                                   alert.priority === "high" ? "default" : "secondary"}
                          >
                            {alert.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Machine:</span>
                            <span className="ml-1">{alert.machineName || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-1">{alert.type}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Créée:</span>
                            <span className="ml-1">{new Date(alert.createdAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <span className="ml-1">{alert.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Créer des Interventions de Test</h4>
                <p className="text-sm text-gray-600">
                  Cliquez sur "Créer Interventions de Test" pour créer automatiquement des interventions 
                  avec différents types de notifications (3min, 3mois, 6mois).
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Vérifier les Alertes</h4>
                <p className="text-sm text-gray-600">
                  Cliquez sur "Vérifier Alertes 3min" pour déclencher la création d'alertes 
                  basées sur les interventions créées.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Observer les Résultats</h4>
                <p className="text-sm text-gray-600">
                  Les interventions apparaîtront dans la colonne de gauche avec leurs badges de notification.
                  Les alertes générées apparaîtront dans la colonne de droite.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">4. Vérifier dans l'Interface</h4>
                <p className="text-sm text-gray-600">
                  Allez dans <code className="bg-gray-100 px-1 rounded">/dashboard/technician/interventions</code> 
                  pour voir les interventions et dans <code className="bg-gray-100 px-1 rounded">/dashboard/technician/alerts</code> 
                  pour voir les alertes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
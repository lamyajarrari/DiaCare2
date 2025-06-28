"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, Calendar } from "lucide-react"

export default function TestMaintenanceSchedulePage() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCheckMaintenanceSchedule = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/maintenance-schedule/check-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Erreur lors de la vérification des maintenances')
      }
    } catch (err) {
      setError('Erreur de connexion: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test des Alertes de Maintenance Programmée</h1>
        <p className="text-gray-600">
          Cette page permet de vérifier les maintenances programmées dans le tableau maintenance-schedule 
          et de créer automatiquement des alertes selon les cycles de 3 mois et 6 mois.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contrôle */}
        <Card>
          <CardHeader>
            <CardTitle>Vérification des Maintenances</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCheckMaintenanceSchedule} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Vérification..." : "Vérifier les Maintenances Programmées"}
            </Button>

            {result && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ {result.message}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ❌ {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <CardTitle>Comment ça fonctionne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Vérification des dates</h4>
                  <p className="text-sm text-gray-600">
                    Le système vérifie toutes les maintenances avec status "Pending" dans maintenance-schedule
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Priorités selon l'urgence</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Critical</strong> : En retard</li>
                    <li>• <strong>High</strong> : Dans les 7 jours</li>
                    <li>• <strong>Medium</strong> : Dans le mois</li>
                    <li>• <strong>Low</strong> : Dans les 2 mois</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Création d'alertes</h4>
                  <p className="text-sm text-gray-600">
                    Une alerte est créée pour chaque maintenance programmée avec les détails des tâches à effectuer
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résultats détaillés */}
      {result && result.createdAlerts && result.createdAlerts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Alertes Créées ({result.createdAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.createdAlerts.map((alert, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{alert.type}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{alert.message}</p>
                  <p className="text-xs text-gray-500">Machine: {alert.machine}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Prochaines étapes :</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Les alertes créées apparaîtront dans /dashboard/technician/alerts</li>
          <li>• Elles seront visibles dans le dropdown d'alertes de la navbar</li>
          <li>• Les alertes critiques (en retard) auront la priorité la plus élevée</li>
          <li>• Vous pouvez exécuter ce script régulièrement pour maintenir les alertes à jour</li>
        </ul>
      </div>
    </div>
  )
} 
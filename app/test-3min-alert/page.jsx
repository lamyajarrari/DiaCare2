"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, Timer } from "lucide-react"

export default function Test3MinAlertPage() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [checkResult, setCheckResult] = useState(null)

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleCreate3MinAlert = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/test-3min-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Erreur lors de la création de l\'alerte 3 minutes')
      }
    } catch (err) {
      setError('Erreur de connexion: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheck3MinControls = async () => {
    setLoading(true)
    setCheckResult(null)
    setError(null)

    try {
      const response = await fetch('/api/check-3min-controls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setCheckResult(data)
      } else {
        setError(data.error || 'Erreur lors de la vérification des contrôles')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test des Alertes 3 Minutes</h1>
        <p className="text-gray-600">
          Cette page permet de tester le système d'alertes avec un cycle de 3 minutes pour vérifier 
          le fonctionnement en temps réel.
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-800">
              Heure actuelle: {currentTime.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Création d'alerte */}
        <Card>
          <CardHeader>
            <CardTitle>Créer une Alerte 3 Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreate3MinAlert} 
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? "Création..." : "Créer Alerte de Test 3 Minutes"}
            </Button>

            {result && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ {result.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Ce que fait ce bouton :</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Crée un contrôle de maintenance terminé maintenant</li>
                <li>• Programme le prochain contrôle dans 3 minutes</li>
                <li>• Crée une alerte de rappel</li>
                <li>• Met à jour la base de données</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Vérification des contrôles */}
        <Card>
          <CardHeader>
            <CardTitle>Vérifier les Contrôles 3 Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCheck3MinControls} 
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? "Vérification..." : "Vérifier les Contrôles 3 Minutes"}
            </Button>

            {checkResult && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ {checkResult.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Ce que fait ce bouton :</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Vérifie tous les contrôles de 3 minutes</li>
                <li>• Crée des alertes si c'est le moment</li>
                <li>• Met à jour les dates de prochain contrôle</li>
                <li>• Affiche les résultats en temps réel</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résultats détaillés */}
      {checkResult && checkResult.createdAlerts && checkResult.createdAlerts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Alertes Créées ({checkResult.createdAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkResult.createdAlerts.map((alert, index) => (
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

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ❌ {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Comment tester le système 3 minutes :</h3>
        <ol className="text-sm text-blue-700 space-y-2">
          <li>1. <strong>Cliquez sur "Créer Alerte de Test 3 Minutes"</strong> - Cela simule une maintenance terminée maintenant</li>
          <li>2. <strong>Attendez 3 minutes</strong> ou cliquez sur "Vérifier les Contrôles 3 Minutes"</li>
          <li>3. <strong>Vérifiez les alertes</strong> dans /dashboard/technician/alerts</li>
          <li>4. <strong>Observez le dropdown d'alertes</strong> dans la navbar</li>
          <li>5. <strong>Répétez le processus</strong> pour tester le cycle continu</li>
        </ol>
        
        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <h4 className="font-medium text-orange-800 mb-2">⚠️ Important :</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Les alertes apparaissent immédiatement si le contrôle est en retard</li>
            <li>• Les alertes "high" apparaissent dans la minute</li>
            <li>• Les alertes "medium" apparaissent dans les 3 minutes</li>
            <li>• Le système recalcule automatiquement la prochaine date de contrôle</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 
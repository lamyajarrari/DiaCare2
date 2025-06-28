"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function TestRemindersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const triggerReminderCheck = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/cron/check-reminders?key=test-key')
      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to check reminders')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test des Rappels d'Interventions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Ce test vérifie les interventions terminées et crée des alertes de rappel 
              pour les interventions datant de 3 mois, 6 mois ou 1 an.
            </p>

            <Button 
              onClick={triggerReminderCheck} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Vérification en cours..." : "Déclencher la vérification des rappels"}
            </Button>

            {result && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ {result.message}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ❌ {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Comment ça marche :</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Le script vérifie toutes les interventions avec status "Completed"</li>
                <li>• Il calcule les dates de rappel (3 mois, 6 mois, 1 an après datePerformed)</li>
                <li>• Si c'est le moment, il crée une alerte dans l'espace alertes</li>
                <li>• Il envoie un email de rappel au technicien concerné</li>
                <li>• Les alertes apparaissent dans la page /dashboard/technician/alerts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
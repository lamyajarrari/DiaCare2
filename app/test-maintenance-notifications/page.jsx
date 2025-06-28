"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useTranslation } from "@/lib/translations"

export default function TestMaintenanceNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const { t } = useTranslation()

  const triggerNotifications = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/maintenance-controls/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
      } else {
        setError(data.error || "Échec du déclenchement des notifications")
      }
    } catch (err) {
      setError("Erreur réseau : " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole="admin" userName="Admin" />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('test.maintenanceNotifications.title')}</h1>
          <p className="text-gray-600">
            {t('test.maintenanceNotifications.description')}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('test.maintenanceNotifications.notificationTrigger')}</CardTitle>
            <CardDescription>
              {t('test.maintenanceNotifications.descriptionText')}
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>{t('test.maintenanceNotifications.overdueControls')}</li>
                <li>{t('test.maintenanceNotifications.upcomingControls')}</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={triggerNotifications}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {t('test.maintenanceNotifications.sendingNotifications')}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t('test.maintenanceNotifications.triggerNotifications')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">{t('common.error')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Résultats des Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {results.results && results.results.length > 0 ? (
                <div className="space-y-4">
                  {results.results.map((result, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.success)}
                        <div>
                          <h4 className="font-medium">{result.technicianName}</h4>
                          <p className="text-sm text-gray-500">
                            {result.controlsCount} contrôles
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={result.success ? "default" : "destructive"}
                        >
                          {result.success ? t('common.success') : t('common.failed')}
                        </Badge>
                        {result.messageId && (
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {result.messageId}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-xs text-red-500 mt-1">
                            {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucun résultat disponible</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
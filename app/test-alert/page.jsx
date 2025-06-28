"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function TestAlertPage() {
  const [formData, setFormData] = useState({
    message: "Test d'alerte - Pression artérielle élevée détectée",
    messageRole: "technician",
    type: "Blood Pressure Alarm",
    requiredAction: "Vérifier les paramètres de pression et ajuster si nécessaire",
    priority: "high",
    machineId: "M001",
    status: "active"
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          message: `Alerte créée avec succès ! ID: ${data.id}`,
          alert: data
        })
      } else {
        setError(data.error || 'Erreur lors de la création de l\'alerte')
      }
    } catch (err) {
      setError('Erreur de connexion: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const presetAlerts = [
    {
      name: "Alerte Pression Artérielle",
      data: {
        message: "Pression artérielle élevée détectée",
        messageRole: "technician",
        type: "Blood Pressure Alarm",
        requiredAction: "Vérifier les paramètres de pression et ajuster si nécessaire",
        priority: "high",
        machineId: "M001",
        status: "active"
      }
    },
    {
      name: "Alerte Fuite d'Air",
      data: {
        message: "Fuite d'air détectée dans le circuit sanguin",
        messageRole: "technician",
        type: "Air Leak Alarm",
        requiredAction: "Vérifier les connexions et le piège à bulles",
        priority: "critical",
        machineId: "M002",
        status: "active"
      }
    },
    {
      name: "Alerte Maintenance",
      data: {
        message: "Maintenance préventive requise",
        messageRole: "technician",
        type: "Maintenance Reminder",
        requiredAction: "Effectuer la maintenance programmée",
        priority: "medium",
        machineId: "M001",
        status: "active"
      }
    }
  ]

  const loadPreset = (preset) => {
    setFormData(preset.data)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test de Création d'Alerte</h1>
        <p className="text-gray-600">
          Cette page permet de créer des alertes de test pour vérifier le fonctionnement du système.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Alertes Prédéfinies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {presetAlerts.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Créer une Alerte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Message de l'alerte"
                  required
                />
              </div>

              <div>
                <Label htmlFor="messageRole">Rôle</Label>
                <Select value={formData.messageRole} onValueChange={(value) => handleChange('messageRole', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Technicien</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type d'Alerte</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  placeholder="Type d'alerte"
                  required
                />
              </div>

              <div>
                <Label htmlFor="requiredAction">Action Requise</Label>
                <Textarea
                  id="requiredAction"
                  value={formData.requiredAction}
                  onChange={(e) => handleChange('requiredAction', e.target.value)}
                  placeholder="Action requise"
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="machineId">ID Machine</Label>
                <Select value={formData.machineId} onValueChange={(value) => handleChange('machineId', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M001">M001 - Fresenius 4008S</SelectItem>
                    <SelectItem value="M002">M002 - Fresenius 6008</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Résolue</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Création..." : "Créer l'Alerte"}
              </Button>
            </form>

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

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Comment tester :</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Créez une alerte avec le formulaire ci-dessus</li>
                <li>• Vérifiez qu'elle apparaît dans /dashboard/technician/alerts</li>
                <li>• Vérifiez qu'elle apparaît dans le dropdown d'alertes de la navbar</li>
                <li>• Vérifiez qu'un email de notification est envoyé (si configuré)</li>
                <li>• Utilisez les presets pour des exemples rapides</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
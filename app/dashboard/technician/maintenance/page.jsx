"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"
import { useTranslation } from "@/lib/translations"

export default function MaintenancePage() {
  const [user, setUser] = useState(null)
  const [maintenance, setMaintenance] = useState([])
  const [machines, setMachines] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [completingId, setCompletingId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { t } = useTranslation()

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
    loadMaintenanceData()
  }, [router])

  const loadMaintenanceData = async () => {
    try {
      const [maintenanceData, machinesData] = await Promise.all([api.getMaintenanceSchedule(), api.getMachines()])

      setMaintenance(maintenanceData)
      setMachines(machinesData)
    } catch (error) {
      console.error("Error loading maintenance data:", error)
      setError("Erreur lors du chargement des données de maintenance")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkComplete = async (maintenanceId) => {
    setCompletingId(maintenanceId)
    setError("")
    setSuccess("")

    try {
      await api.updateMaintenanceStatus(maintenanceId, "Completed")
      setSuccess("Maintenance marquée comme terminée")
      
      // Update the local state to reflect the change
      setMaintenance(prev => prev.map(item => 
        item.id === maintenanceId 
          ? { ...item, status: "Completed", completedAt: new Date().toISOString() }
          : item
      ))
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error marking maintenance as complete:", error)
      setError("Erreur lors de la mise à jour")
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(""), 3000)
    } finally {
      setCompletingId(null)
    }
  }

  const getMachineName = (machineId) => {
    const machine = machines.find((m) => m.id === machineId)
    return machine ? machine.name : machineId
  }

  const getMaintenanceTasks = (type) => {
    switch (type) {
      case "3-month":
        return ["Replace filters / Clean if necessary", "Check motorized clamps", "Tighten electrical connections"]
      case "6-month":
        return [
          "Full calibration with calibrated tools",
          "Inspect hydraulic components (leaks, corrosion, deposits)",
          "Firmware updates via Fresenius service",
        ]
      case "yearly":
        return [
          "Replace hydraulic seals and pump wheels",
          "Electrical safety tests (ground resistance, leakage current)",
          "Maintenance report update and archiving",
        ]
      default:
        return []
    }
  }

  if (!user || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('maintenance.title')}</h1>
          <p className="text-gray-600">{t('maintenance.description')}</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('maintenance.threeMonthTasks')}</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenance.filter((m) => m.type === "3-month").length}</div>
              <p className="text-xs text-muted-foreground">{t('maintenance.quarterlyMaintenance')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('maintenance.sixMonthTasks')}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenance.filter((m) => m.type === "6-month").length}</div>
              <p className="text-xs text-muted-foreground">{t('maintenance.semiAnnualMaintenance')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('maintenance.yearlyTasks')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenance.filter((m) => m.type === "yearly").length}</div>
              <p className="text-xs text-muted-foreground">{t('maintenance.annualMaintenance')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenance.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{getMachineName(item.machineId)}</h3>
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge variant={item.status === "Pending" ? "destructive" : "default"}>{item.status === "Completed" ? t('maintenance.completed') : t('maintenance.pending')}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Due Date:</strong> {item.dueDate}
                        </p>
                        {item.status === "Completed" && item.completedAt && (
                          <p className="text-sm text-green-600 mb-2">
                            <strong>Completed:</strong> {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        )}
                        <div className="text-sm text-gray-600">
                          <strong>Tasks:</strong>
                          <ul className="list-disc list-inside mt-1 ml-4">
                            {getMaintenanceTasks(item.type).map((task, index) => (
                              <li key={index}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status === "Pending" ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkComplete(item.id)}
                            disabled={completingId === item.id}
                          >
                            {completingId === item.id ? t('interventions.marking') : t('interventions.markComplete')}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('maintenance.completed')}
                          </Button>
                        )}
                        <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                          {t('interventions.startMaintenance')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {maintenance.length === 0 && (
                  <div className="text-center py-8 text-gray-500">{t('maintenance.noMaintenanceTasks')}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.maintenanceGuidelines')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">{t('maintenance.every3Months')}</h4>
                  <ul className="text-sm space-y-1">
                    <li>{t('maintenance.replaceFilters')}</li>
                    <li>{t('maintenance.checkMotorizedClamps')}</li>
                    <li>{t('maintenance.tightenConnections')}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">{t('maintenance.every6Months')}</h4>
                  <ul className="text-sm space-y-1">
                    <li>{t('maintenance.fullCalibration')}</li>
                    <li>{t('maintenance.inspectHydraulic')}</li>
                    <li>{t('maintenance.firmwareUpdates')}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">{t('maintenance.onceAYear')}</h4>
                  <ul className="text-sm space-y-1">
                    <li>{t('maintenance.replaceSeals')}</li>
                    <li>{t('maintenance.electricalTests')}</li>
                    <li>{t('maintenance.maintenanceReport')}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

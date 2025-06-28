"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Wrench, Calendar, Bell } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"
import { useInterventionsCount } from "@/hooks/use-interventions-count"
import { useMaintenanceScheduleCount } from "@/hooks/use-maintenance-schedule-count"

export default function TechnicianDashboard() {
  const [user, setUser] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Utiliser les hooks pour les comptages dynamiques
  const { interventionsCount, loading: interventionsLoading } = useInterventionsCount('technician', user?.technicianId)
  const { maintenanceCount, loading: maintenanceLoading } = useMaintenanceScheduleCount('Pending')

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
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      const [alertsData, maintenanceData] = await Promise.all([
        api.getAlerts(),
        api.getMaintenanceSchedule(),
      ])

      setAlerts(alertsData)
      setMaintenance(maintenanceData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  const activeAlerts = alerts.filter((a) => a.status === "active")
  const pendingMaintenance = maintenance.filter((m) => m.status === "Pending")

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
          <p className="text-gray-600">Monitor alerts, manage interventions, and track maintenance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interventions</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interventionsLoading ? "..." : interventionsCount}
              </div>
              <p className="text-xs text-muted-foreground">Total interventions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {maintenanceLoading ? "..." : maintenanceCount}
              </div>
              <p className="text-xs text-muted-foreground">Scheduled tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Bell className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push("/dashboard/technician/alerts")}
                >
                  View Alerts
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push("/dashboard/technician/interventions/new")}
                >
                  New Intervention
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.type}</p>
                    </div>
                    <Badge variant={alert.priority === "critical" ? "destructive" : "secondary"}>
                      {alert.priority}
                    </Badge>
                  </div>
                ))}
                {activeAlerts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No active alerts</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Maintenance</CardTitle>
              <CardDescription>Scheduled maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingMaintenance.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{task.type}</p>
                      <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
                {pendingMaintenance.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No pending maintenance</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

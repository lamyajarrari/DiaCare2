"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Calendar, Wrench, Users, Settings, BarChart3 } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useAlertsCount } from "@/hooks/use-alerts-count"
import { useInterventionsCount } from "@/hooks/use-interventions-count"
import { useMaintenanceScheduleCount } from "@/hooks/use-maintenance-schedule-count"
import { useTranslation } from "@/lib/translations"

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [machines, setMachines] = useState([])
  const [users, setUsers] = useState([])
  const router = useRouter()
  const { t } = useTranslation()

  // Hooks pour les compteurs
  const { alertsCount, loading: alertsLoading } = useAlertsCount("admin")
  const { interventionsCount, loading: interventionsLoading } = useInterventionsCount()
  const { maintenanceCount, loading: maintenanceLoading } = useMaintenanceScheduleCount()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/login")
      return
    }

    setUser(parsedUser)
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      // Charger les données de base
      const [machinesData, usersData] = await Promise.all([
        fetch("/api/machines").then(res => res.json()),
        fetch("/api/users").then(res => res.json()),
      ])

      setMachines(machinesData)
      setUsers(usersData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('navigation.dashboard')}</h1>
          <p className="text-gray-600">Gestion complète du système DiaCare</p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeAlerts')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alertsLoading ? "..." : alertsCount}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.requireAttention')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.pendingMaintenance')}</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {maintenanceLoading ? "..." : maintenanceCount}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.scheduledTasks')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.interventions')}</CardTitle>
              <Wrench className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interventionsLoading ? "..." : interventionsCount}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.totalInterventions')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.machines')}</CardTitle>
              <Settings className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machines.length}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.totalMachines')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('navigation.users')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gérer les utilisateurs, les rôles et les permissions
              </p>
              <Button 
                onClick={() => router.push("/dashboard/admin/users")}
                className="w-full"
              >
                {t('common.view')} {t('navigation.users')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('navigation.machines')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gérer l'inventaire des machines et leur statut
              </p>
              <Button 
                onClick={() => router.push("/dashboard/admin/machines")}
                className="w-full"
              >
                {t('common.view')} {t('navigation.machines')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('navigation.reports')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Consulter les rapports et analyses du système
              </p>
              <Button 
                onClick={() => router.push("/dashboard/admin/reports")}
                className="w-full"
              >
                {t('common.view')} {t('navigation.reports')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, TrendingUp, AlertTriangle, Wrench, Clock } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"

export default function ReportsPage() {
  const [user, setUser] = useState(null)
  const [reportData, setReportData] = useState({
    faults: [],
    interventions: [],
    maintenance: [],
    alerts: [],
  })
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
    loadReportData()
  }, [router])

  const loadReportData = async () => {
    try {
      const [faults, interventions, maintenance, alerts] = await Promise.all([
        api.getFaults(),
        api.getInterventions(),
        api.getMaintenanceSchedule(),
        api.getAlerts(),
      ])

      setReportData({ faults, interventions, maintenance, alerts })
    } catch (error) {
      console.error("Error loading report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = () => {
    // Mock report generation
    const reportContent = {
      period: selectedPeriod,
      totalFaults: reportData.faults.length,
      resolvedFaults: reportData.faults.filter((f) => f.status === "Resolved").length,
      totalInterventions: reportData.interventions.length,
      completedInterventions: reportData.interventions.filter((i) => i.status === "Completed").length,
      pendingMaintenance: reportData.maintenance.filter((m) => m.status === "Pending").length,
      activeAlerts: reportData.alerts.filter((a) => a.status === "active").length,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `diacare-report-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!user || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  const faultTypes = reportData.faults.reduce((acc, fault) => {
    acc[fault.faultType] = (acc[fault.faultType] || 0) + 1
    return acc
  }, {})

  const topFaultTypes = Object.entries(faultTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const totalDowntime = reportData.faults.reduce((acc, fault) => {
    return acc + Number.parseFloat(fault.downtime.replace(" hours", ""))
  }, 0)

  const avgResolutionTime = reportData.faults.length > 0 ? (totalDowntime / reportData.faults.length).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">System performance metrics and insights</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateReport} className="bg-teal-500 hover:bg-teal-600">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faults</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.faults.length}</div>
              <p className="text-xs text-muted-foreground">
                {reportData.faults.filter((f) => f.status === "Resolved").length} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interventions</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.interventions.length}</div>
              <p className="text-xs text-muted-foreground">
                {reportData.interventions.filter((i) => i.status === "Completed").length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDowntime}h</div>
              <p className="text-xs text-muted-foreground">Avg: {avgResolutionTime}h per fault</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">Above target (95%)</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Fault Types</CardTitle>
              <CardDescription>Top 5 fault categories by frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topFaultTypes.map(([type, count], index) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-teal-500 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(faultTypes))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                ))}
                {topFaultTypes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No fault data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Performance</CardTitle>
              <CardDescription>Preventive vs corrective maintenance ratio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Preventive Maintenance:</span>
                  <span className="text-sm text-green-600 font-medium">
                    {reportData.interventions.filter((i) => i.interventionType === "Preventive").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Corrective Maintenance:</span>
                  <span className="text-sm text-orange-600 font-medium">
                    {reportData.interventions.filter((i) => i.interventionType === "Curative").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pending Tasks:</span>
                  <span className="text-sm text-red-600 font-medium">
                    {reportData.maintenance.filter((m) => m.status === "Pending").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Alerts:</span>
                  <span className="text-sm text-red-600 font-medium">
                    {reportData.alerts.filter((a) => a.status === "active").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

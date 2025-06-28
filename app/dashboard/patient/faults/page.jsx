"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"
import { useTranslation } from "@/lib/translations"

export default function PatientFaultsPage() {
  const [user, setUser] = useState(null)
  const [faults, setFaults] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "patient") {
      router.push("/login")
      return
    }

    setUser(parsedUser)
    loadFaults()
  }, [router])

  const loadFaults = async () => {
    try {
      const data = await api.getFaults()
      setFaults(data)
    } catch (error) {
      console.error("Error loading faults:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      [
        t('faults.date'),
        t('faults.faultType'),
        t('faults.description'),
        t('faults.downtime'),
        t('faults.rootCause'),
        t('faults.correctiveAction'),
        t('faults.status'),
        t('faults.machine'),
        t('faults.patient')
      ].join(','),
      ...filteredFaults.map(fault => [
        fault.date,
        fault.faultType,
        `"${fault.description.replace(/"/g, '""')}"`,
        fault.downtime,
        `"${fault.rootCause.replace(/"/g, '""')}"`,
        `"${fault.correctiveAction.replace(/"/g, '""')}"`,
        fault.status,
        fault.machine?.name || '',
        fault.patient?.name || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'faults_export.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredFaults = faults.filter(fault => 
    fault.faultType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fault.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fault.machine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fault.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('faults.title')}</h1>
          <p className="text-gray-600">{t('faults.description')}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>{t('faults.faultRecords')}</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('faults.searchFaults')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {t('faults.exportCSV')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFaults.map((fault) => (
                <div key={fault.id} className="border rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{fault.faultType}</h3>
                        <Badge variant={fault.status === "Resolved" ? "default" : "secondary"}>
                          {fault.status === "Resolved" ? t('alerts.resolved') : t('alerts.pending')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                        <p><strong>{t('faults.date')}:</strong> {fault.date}</p>
                        <p><strong>{t('faults.machine')}:</strong> {fault.machine?.name}</p>
                        <p><strong>{t('faults.patient')}:</strong> {fault.patient?.name}</p>
                        <p><strong>{t('faults.downtime')}:</strong> {fault.downtime}</p>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p><strong>{t('faults.description')}:</strong> {fault.description}</p>
                        <p><strong>{t('faults.rootCause')}:</strong> {fault.rootCause}</p>
                        <p><strong>{t('faults.correctiveAction')}:</strong> {fault.correctiveAction}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredFaults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? t('common.noResults')
                    : t('common.noData')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Plus, Calendar, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"
import { useTranslation } from "@/lib/translations"

export default function MaintenanceControlsPage() {
  const [user, setUser] = useState(null)
  const [controls, setControls] = useState([])
  const [machines, setMachines] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newControl, setNewControl] = useState({
    machineId: "",
    technicianId: "",
    controlType: "",
    controlDate: "",
    notes: "",
  })
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
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [controlsData, machinesData, techniciansData] = await Promise.all([
        api.getMaintenanceControls(),
        api.getMachines(),
        api.getUsers().then(users => users.filter(u => u.role === 'technician')),
      ])

      setControls(controlsData)
      setMachines(machinesData)
      setTechnicians(techniciansData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateControl = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const response = await api.createMaintenanceControl(newControl)
      setControls([response, ...controls])
      setNewControl({
        machineId: "",
        technicianId: "",
        controlType: "",
        controlDate: "",
        notes: "",
      })
      setIsDialogOpen(false)
      setSuccess("Contrôle de maintenance créé avec succès")
    } catch (error) {
      setError("Erreur lors de la création du contrôle")
      console.error("Error creating control:", error)
    }
  }

  const getControlTypeLabel = (type) => {
    const labels = {
      '3_months': t('maintenanceControls.threeMonths'),
      '6_months': t('maintenanceControls.sixMonths'),
      '1_year': t('maintenanceControls.oneYear')
    }
    return labels[type] || type
  }

  const getStatusBadge = (control) => {
    const today = new Date()
    const nextControlDate = new Date(control.nextControlDate)
    
    if (nextControlDate < today) {
      return <Badge variant="destructive">{t('maintenanceControls.overdue')}</Badge>
    } else if (nextControlDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge variant="secondary">{t('maintenanceControls.upcoming')}</Badge>
    } else {
      return <Badge variant="outline">{t('maintenanceControls.planned')}</Badge>
    }
  }

  const filteredControls = controls.filter((control) => {
    const matchesSearch = 
      control.machine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.technician?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.machine?.inventoryNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "overdue" && new Date(control.nextControlDate) < new Date()) ||
      (statusFilter === "upcoming" && new Date(control.nextControlDate) > new Date() && 
       new Date(control.nextControlDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000) ||
      (statusFilter === "planned" && new Date(control.nextControlDate) > new Date() && 
       new Date(control.nextControlDate).getTime() - new Date().getTime() >= 7 * 24 * 60 * 60 * 1000)
    
    return matchesSearch && matchesStatus
  })

  if (!user || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('maintenanceControls.title')}</h1>
          <p className="text-gray-600">Gestion des contrôles de maintenance préventive</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>{t('maintenanceControls.title')}</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="upcoming">À venir</SelectItem>
                    <SelectItem value="planned">Planifié</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('maintenanceControls.addControl')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('maintenanceControls.addControl')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateControl} className="space-y-4">
                      <div>
                        <Label htmlFor="machineId">{t('maintenanceControls.machine')}</Label>
                        <Select onValueChange={(value) => setNewControl({...newControl, machineId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une machine" />
                          </SelectTrigger>
                          <SelectContent>
                            {machines.map((machine) => (
                              <SelectItem key={machine.id} value={machine.id}>
                                {machine.name} - {machine.inventoryNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="technicianId">{t('maintenanceControls.technician')}</Label>
                        <Select onValueChange={(value) => setNewControl({...newControl, technicianId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un technicien" />
                          </SelectTrigger>
                          <SelectContent>
                            {technicians.map((technician) => (
                              <SelectItem key={technician.id} value={technician.technicianId}>
                                {technician.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="controlType">{t('maintenanceControls.controlType')}</Label>
                        <Select onValueChange={(value) => setNewControl({...newControl, controlType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3_months">{t('maintenanceControls.threeMonths')}</SelectItem>
                            <SelectItem value="6_months">{t('maintenanceControls.sixMonths')}</SelectItem>
                            <SelectItem value="1_year">{t('maintenanceControls.oneYear')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="controlDate">{t('maintenanceControls.controlDate')}</Label>
                        <Input
                          id="controlDate"
                          type="date"
                          value={newControl.controlDate}
                          onChange={(e) => setNewControl({...newControl, controlDate: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">{t('maintenanceControls.notes')}</Label>
                        <Textarea
                          id="notes"
                          value={newControl.notes}
                          onChange={(e) => setNewControl({...newControl, notes: e.target.value})}
                          rows={3}
                          placeholder="Notes optionnelles..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          {t('maintenanceControls.save')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          {t('maintenanceControls.cancel')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredControls.map((control) => (
                <div key={control.id} className="border rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{control.machine?.name}</h3>
                        {getStatusBadge(control)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                        <p><strong>{t('machines.inventoryNumber')}:</strong> {control.machine?.inventoryNumber}</p>
                        <p><strong>{t('machines.department')}:</strong> {control.machine?.department}</p>
                        <p><strong>{t('maintenanceControls.technician')}:</strong> {control.technician?.name}</p>
                        <p><strong>{t('maintenanceControls.controlType')}:</strong> {getControlTypeLabel(control.controlType)}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                        <p><strong>{t('maintenanceControls.controlDate')}:</strong> {new Date(control.controlDate).toLocaleDateString('fr-FR')}</p>
                        <p><strong>{t('maintenanceControls.nextControlDate')}:</strong> {new Date(control.nextControlDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {control.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>{t('maintenanceControls.notes')}:</strong> {control.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredControls.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? t('maintenanceControls.noControlsMatch')
                    : t('maintenanceControls.noControlsFound')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
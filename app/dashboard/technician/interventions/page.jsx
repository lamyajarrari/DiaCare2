"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, FileText, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"

export default function InterventionsPage() {
  const [user, setUser] = useState(null)
  const [interventions, setInterventions] = useState([])
  const [filteredInterventions, setFilteredInterventions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [interventionToDelete, setInterventionToDelete] = useState(null)
  const router = useRouter()

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
    loadInterventions()
  }, [router])

  useEffect(() => {
    filterInterventions()
  }, [interventions, searchTerm, statusFilter, typeFilter])

  const loadInterventions = async () => {
    try {
      const interventionsData = await api.getInterventions()
      setInterventions(interventionsData)
    } catch (error) {
      console.error("Error loading interventions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterInterventions = () => {
    let filtered = interventions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(intervention =>
        intervention.equipmentDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.problemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(intervention => intervention.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(intervention => intervention.interventionType === typeFilter)
    }

    setFilteredInterventions(filtered)
  }

  const updateInterventionStatus = async (interventionId, newStatus) => {
    setIsUpdatingStatus(true)
    try {
      // Update the intervention status in the database
      const response = await fetch(`/api/interventions/${interventionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update local state
        setInterventions(prev => prev.map(intervention =>
          intervention.id === interventionId
            ? { ...intervention, status: newStatus }
            : intervention
        ))
        
        // Update selected intervention if it's the one being updated
        if (selectedIntervention && selectedIntervention.id === interventionId) {
          setSelectedIntervention(prev => ({ ...prev, status: newStatus }))
        }
      }
    } catch (error) {
      console.error("Error updating intervention status:", error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDeleteIntervention = async (interventionId) => {
    setIsDeleting(true)
    setDeleteError("")
    try {
      await api.deleteIntervention(interventionId)
      setInterventions(prev => prev.filter(i => i.id !== interventionId))
      setFilteredInterventions(prev => prev.filter(i => i.id !== interventionId))
      setInterventionToDelete(null)
    } catch (error) {
      setDeleteError(error.message || "Échec de la suppression de l'intervention")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Completed":
        return "default"
      case "In Progress":
        return "secondary"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const openInterventionModal = (intervention) => {
    setSelectedIntervention(intervention)
    setIsModalOpen(true)
  }

  if (!user || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interventions</h1>
            <p className="text-gray-600">Gérer les rapports d'intervention technique et l'historique</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/technician/interventions/new")}
            className="bg-teal-500 hover:bg-teal-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Intervention
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des interventions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les Statuts</SelectItem>
                  <SelectItem value="Pending">En Attente</SelectItem>
                  <SelectItem value="In Progress">En Cours</SelectItem>
                  <SelectItem value="Completed">Terminé</SelectItem>
                  <SelectItem value="Cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les Types</SelectItem>
                  <SelectItem value="Preventive">Préventive</SelectItem>
                  <SelectItem value="Curative">Curative</SelectItem>
                  <SelectItem value="Emergency">Urgence</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-500 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                {filteredInterventions.length} sur {interventions.length} interventions
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des Interventions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInterventions.map((intervention) => (
                <div key={intervention.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{intervention.equipmentDescription}</h3>
                        <Badge variant={intervention.interventionType === "Preventive" ? "default" : "secondary"}>
                          {intervention.interventionType === "Preventive" ? "Préventive" : 
                           intervention.interventionType === "Curative" ? "Curative" : 
                           intervention.interventionType === "Emergency" ? "Urgence" : intervention.interventionType}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(intervention.status)}>
                          {getStatusIcon(intervention.status)}
                          <span className="ml-1">
                            {intervention.status === "Pending" ? "En Attente" :
                             intervention.status === "In Progress" ? "En Cours" :
                             intervention.status === "Completed" ? "Terminé" :
                             intervention.status === "Cancelled" ? "Annulé" : intervention.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          <strong>Date de Demande :</strong> {intervention.requestDate}
                        </p>
                        <p>
                          <strong>Département :</strong> {intervention.department}
                        </p>
                        <p>
                          <strong>Demandé Par :</strong> {intervention.requestedBy}
                        </p>
                        <p>
                          <strong>Technicien :</strong> {intervention.technician || "Non assigné"}
                        </p>
                        {intervention.timeSpent && (
                          <p>
                            <strong>Temps Passé :</strong> {intervention.timeSpent} heures
                          </p>
                        )}
                        {intervention.partsReplaced && (
                          <p>
                            <strong>Pièces Remplacées :</strong> {intervention.partsReplaced}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Problème :</strong> {intervention.problemDescription}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openInterventionModal(intervention)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Voir les Détails
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Détails de l'Intervention</DialogTitle>
                          </DialogHeader>
                          {selectedIntervention && (
                            <div className="space-y-6">
                              {/* Header Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">{selectedIntervention.equipmentDescription}</h3>
                                  <div className="flex gap-2 mb-4">
                                    <Badge variant={selectedIntervention.interventionType === "Preventive" ? "default" : "secondary"}>
                                      {selectedIntervention.interventionType === "Preventive" ? "Préventive" : 
                                       selectedIntervention.interventionType === "Curative" ? "Curative" : 
                                       selectedIntervention.interventionType === "Emergency" ? "Urgence" : selectedIntervention.interventionType}
                                    </Badge>
                                    <Badge variant={getStatusBadgeVariant(selectedIntervention.status)}>
                                      {getStatusIcon(selectedIntervention.status)}
                                      <span className="ml-1">
                                        {selectedIntervention.status === "Pending" ? "En Attente" :
                                         selectedIntervention.status === "In Progress" ? "En Cours" :
                                         selectedIntervention.status === "Completed" ? "Terminé" :
                                         selectedIntervention.status === "Cancelled" ? "Annulé" : selectedIntervention.status}
                                      </span>
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Numéro d'Inventaire</p>
                                  <p className="font-medium">{selectedIntervention.inventoryNumber}</p>
                                </div>
                              </div>

                              {/* Request Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Informations de Demande</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Date de Demande :</strong> {selectedIntervention.requestDate}</p>
                                    <p><strong>Département :</strong> {selectedIntervention.department}</p>
                                    <p><strong>Demandé Par :</strong> {selectedIntervention.requestedBy}</p>
                                    <p><strong>Intervention Demandée :</strong> {selectedIntervention.requestedIntervention}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Chronologie</h4>
                                  <div className="space-y-2 text-sm">
                                    {selectedIntervention.arrivalAtWorkshop && (
                                      <p><strong>Arrivée à l'Atelier :</strong> {selectedIntervention.arrivalAtWorkshop}</p>
                                    )}
                                    {selectedIntervention.datePerformed && (
                                      <p><strong>Date d'Exécution :</strong> {selectedIntervention.datePerformed}</p>
                                    )}
                                    {selectedIntervention.returnToService && (
                                      <p><strong>Retour en Service :</strong> {selectedIntervention.returnToService}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Problem and Solution */}
                              <div>
                                <h4 className="font-semibold mb-2">Description du Problème</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">{selectedIntervention.problemDescription}</p>
                              </div>

                              {selectedIntervention.tasksCompleted && (
                                <div>
                                  <h4 className="font-semibold mb-2">Tâches Accomplies</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedIntervention.tasksCompleted}</p>
                                </div>
                              )}

                              {/* Parts and Cost */}
                              {(selectedIntervention.partsReplaced || selectedIntervention.partDescription || selectedIntervention.price) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedIntervention.partsReplaced && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Pièces Remplacées</h4>
                                      <p className="text-sm">{selectedIntervention.partsReplaced}</p>
                                    </div>
                                  )}
                                  {selectedIntervention.partDescription && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Description de la Pièce</h4>
                                      <p className="text-sm">{selectedIntervention.partDescription}</p>
                                    </div>
                                  )}
                                  {selectedIntervention.price && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Coût</h4>
                                      <p className="text-sm font-medium">{selectedIntervention.price}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Technician Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Informations du Technicien</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Technicien :</strong> {selectedIntervention.technician || "Non assigné"}</p>
                                    {selectedIntervention.timeSpent && (
                                      <p><strong>Temps Passé :</strong> {selectedIntervention.timeSpent} heures</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Gestion du Statut</h4>
                                  <div className="space-y-2">
                                    <Select 
                                      value={selectedIntervention.status} 
                                      onValueChange={(value) => updateInterventionStatus(selectedIntervention.id, value)}
                                      disabled={isUpdatingStatus}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Pending">En Attente</SelectItem>
                                        <SelectItem value="In Progress">En Cours</SelectItem>
                                        <SelectItem value="Completed">Terminé</SelectItem>
                                        <SelectItem value="Cancelled">Annulé</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting && interventionToDelete === intervention.id}
                        onClick={() => setInterventionToDelete(intervention.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredInterventions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {interventions.length === 0 ? "Aucune intervention enregistrée pour le moment" : "Aucune intervention ne correspond à vos filtres"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de confirmation de suppression */}
        {interventionToDelete && (
          <Dialog open={!!interventionToDelete} onOpenChange={() => setInterventionToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer l'Intervention</DialogTitle>
              </DialogHeader>
              <div>Êtes-vous sûr de vouloir supprimer cette intervention ?</div>
              {deleteError && <div className="text-red-600 text-sm mt-2">{deleteError}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setInterventionToDelete(null)} disabled={isDeleting}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteIntervention(interventionToDelete)} disabled={isDeleting}>
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

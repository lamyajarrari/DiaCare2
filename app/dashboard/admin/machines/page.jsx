"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Settings, Trash2, AlertCircle, CheckCircle, Edit } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"

export default function MachinesPage() {
  const [user, setUser] = useState(null)
  const [machines, setMachines] = useState([])
  const [filteredMachines, setFilteredMachines] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [editingMachine, setEditingMachine] = useState(null)
  const [deletionDetails, setDeletionDetails] = useState(null)
  const [showDeletionDetails, setShowDeletionDetails] = useState(false)
  const [machineToDelete, setMachineToDelete] = useState(null)
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false)
  const [newMachine, setNewMachine] = useState({
    name: "",
    inventoryNumber: "",
    department: "",
    status: "Active",
  })
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
    loadMachines()
  }, [router])

  useEffect(() => {
    let filtered = machines

    if (searchTerm) {
      filtered = filtered.filter(
        (machine) =>
          machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.department.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((machine) => machine.status === statusFilter)
    }

    setFilteredMachines(filtered)
  }, [machines, searchTerm, statusFilter])

  const loadMachines = async () => {
    try {
      const machinesData = await api.getMachines()
      setMachines(machinesData)
      setFilteredMachines(machinesData)
    } catch (error) {
      console.error("Error loading machines:", error)
      setError("Échec du chargement des machines")
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (machineData) => {
    const errors = {}
    
    if (!machineData.name.trim()) {
      errors.name = "Le nom de la machine est requis"
    }
    
    if (!machineData.inventoryNumber.trim()) {
      errors.inventoryNumber = "Le numéro d'inventaire est requis"
    }
    
    if (!machineData.department) {
      errors.department = "Le département est requis"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateMachine = async (e) => {
    e.preventDefault()
    
    if (!validateForm(newMachine)) {
      return
    }

    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      await api.createMachine({
        ...newMachine,
        lastMaintenance: new Date().toISOString().split("T")[0],
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      })
      
      setSuccess("Machine créée avec succès !")
      setIsDialogOpen(false)
      setNewMachine({ name: "", inventoryNumber: "", department: "", status: "Active" })
      setFormErrors({})
      
      // Reload machines after a short delay to show success message
      setTimeout(() => {
        loadMachines()
      }, 1000)
    } catch (error) {
      console.error("Error creating machine:", error)
      setError(error.message || "Échec de la création de la machine. Veuillez réessayer.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditMachine = async (e) => {
    e.preventDefault()
    
    if (!validateForm(editingMachine)) {
      return
    }

    setIsUpdating(true)
    setError("")
    setSuccess("")

    try {
      await api.updateMachine(editingMachine.id, {
        name: editingMachine.name,
        inventoryNumber: editingMachine.inventoryNumber,
        department: editingMachine.department,
        status: editingMachine.status,
      })
      
      setSuccess("Machine mise à jour avec succès !")
      setIsEditDialogOpen(false)
      setEditingMachine(null)
      setFormErrors({})
      
      // Reload machines after a short delay to show success message
      setTimeout(() => {
        loadMachines()
      }, 1000)
    } catch (error) {
      console.error("Error updating machine:", error)
      setError(error.message || "Échec de la mise à jour de la machine. Veuillez réessayer.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteMachine = async (machineId, machineName) => {
    setMachineToDelete({ id: machineId, name: machineName })
    setShowForceDeleteDialog(true)
  }

  const confirmDeleteMachine = async (forceDelete = false) => {
    if (!machineToDelete) return

    setIsDeleting(true)
    setError("")
    setSuccess("")
    setShowForceDeleteDialog(false)

    try {
      const result = await api.deleteMachine(machineToDelete.id, forceDelete)
      
      if (forceDelete && result.deletedData) {
        const deletedItems = [];
        if (result.deletedData.faults > 0) deletedItems.push(`${result.deletedData.faults} panne(s)`);
        if (result.deletedData.alerts > 0) deletedItems.push(`${result.deletedData.alerts} alerte(s)`);
        if (result.deletedData.maintenanceSchedule > 0) deletedItems.push(`${result.deletedData.maintenanceSchedule} planification(s) de maintenance`);
        if (result.deletedData.maintenanceControls > 0) deletedItems.push(`${result.deletedData.maintenanceControls} contrôle(s) de maintenance`);
        
        setSuccess(`Machine "${machineToDelete.name}" et toutes les données associées (${deletedItems.join(', ')}) supprimées avec succès !`)
      } else {
        setSuccess("Machine supprimée avec succès !")
      }
      
      // Reload machines after a short delay to show success message
      setTimeout(() => {
        loadMachines()
      }, 1000)
    } catch (error) {
      console.error("Error deleting machine:", error)
      
      // Gérer les différents types d'erreurs
      if (error.message.includes("Cannot delete machine")) {
        // Machine a des données liées
        const detailsMatch = error.message.match(/details: ({.*})/);
        if (detailsMatch) {
          try {
            const details = JSON.parse(detailsMatch[1]);
            const relatedData = [];
            
            if (details.faults > 0) relatedData.push(`${details.faults} panne(s)`);
            if (details.alerts > 0) relatedData.push(`${details.alerts} alerte(s)`);
            if (details.maintenanceSchedule > 0) relatedData.push(`${details.maintenanceSchedule} planification(s) de maintenance`);
            if (details.maintenanceControls > 0) relatedData.push(`${details.maintenanceControls} contrôle(s) de maintenance`);
            
            setError(`Impossible de supprimer la machine "${machineToDelete.name}" car elle a des données associées : ${relatedData.join(', ')}. Veuillez supprimer ou réassigner ces éléments en premier.`)
            setDeletionDetails(details)
          } catch (parseError) {
            setError(`Impossible de supprimer la machine "${machineToDelete.name}" car elle a des données associées. Veuillez supprimer toutes les pannes, alertes, planifications de maintenance et contrôles associés en premier.`)
            setDeletionDetails(null)
          }
        } else {
          setError(`Impossible de supprimer la machine "${machineToDelete.name}" car elle a des données associées. Veuillez supprimer toutes les pannes, alertes, planifications de maintenance et contrôles associés en premier.`)
          setDeletionDetails(null)
        }
      } else {
        setError(error.message || "Échec de la suppression de la machine. Veuillez réessayer.")
        setDeletionDetails(null)
      }
    } finally {
      setIsDeleting(false)
      setMachineToDelete(null)
    }
  }

  const openEditDialog = (machine) => {
    setEditingMachine({
      id: machine.id,
      name: machine.name,
      inventoryNumber: machine.inventoryNumber,
      department: machine.department,
      status: machine.status,
    })
    setFormErrors({})
    setError("")
    setSuccess("")
    setIsEditDialogOpen(true)
  }

  const handleInputChange = (field, value) => {
    setNewMachine(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleEditInputChange = (field, value) => {
    setEditingMachine(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const resetForm = () => {
    setNewMachine({ name: "", inventoryNumber: "", department: "", status: "Active" })
    setFormErrors({})
    setError("")
    setSuccess("")
  }

  const resetEditForm = () => {
    setEditingMachine(null)
    setFormErrors({})
    setError("")
    setSuccess("")
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Machines</h1>
            <p className="text-gray-600">Gérer les machines de dialyse et l'équipement</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-teal-500 hover:bg-teal-600">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une Nouvelle Machine</DialogTitle>
              </DialogHeader>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreateMachine} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de la Machine *</Label>
                  <Input
                    id="name"
                    value={newMachine.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="ex: Fresenius 4008S"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="inventoryNumber">Numéro d'Inventaire *</Label>
                  <Input
                    id="inventoryNumber"
                    value={newMachine.inventoryNumber}
                    onChange={(e) => handleInputChange("inventoryNumber", e.target.value)}
                    placeholder="ex: INV-003"
                    className={formErrors.inventoryNumber ? "border-red-500" : ""}
                  />
                  {formErrors.inventoryNumber && <p className="text-sm text-red-500 mt-1">{formErrors.inventoryNumber}</p>}
                </div>
                
                <div>
                  <Label htmlFor="department">Département *</Label>
                  <Select 
                    value={newMachine.department} 
                    onValueChange={(value) => handleInputChange("department", value)}
                  >
                    <SelectTrigger className={formErrors.department ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionner un département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dialysis Unit A">Unité de Dialyse A</SelectItem>
                      <SelectItem value="Dialysis Unit B">Unité de Dialyse B</SelectItem>
                      <SelectItem value="Dialysis Unit C">Unité de Dialyse C</SelectItem>
                      <SelectItem value="ICU">USI</SelectItem>
                      <SelectItem value="Emergency">Urgences</SelectItem>
                      <SelectItem value="Operating Room">Salle d'Opération</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.department && <p className="text-sm text-red-500 mt-1">{formErrors.department}</p>}
                </div>
                
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={newMachine.status} 
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Actif</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-teal-500 hover:bg-teal-600"
                    disabled={isCreating}
                  >
                    {isCreating ? "Création..." : "Ajouter la Machine"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Machine Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) resetEditForm()
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier la Machine</DialogTitle>
            </DialogHeader>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {editingMachine && (
              <form onSubmit={handleEditMachine} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nom de la Machine *</Label>
                  <Input
                    id="edit-name"
                    value={editingMachine.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                    placeholder="ex: Fresenius 4008S"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="edit-inventoryNumber">Numéro d'Inventaire *</Label>
                  <Input
                    id="edit-inventoryNumber"
                    value={editingMachine.inventoryNumber}
                    onChange={(e) => handleEditInputChange("inventoryNumber", e.target.value)}
                    placeholder="ex: INV-003"
                    className={formErrors.inventoryNumber ? "border-red-500" : ""}
                  />
                  {formErrors.inventoryNumber && <p className="text-sm text-red-500 mt-1">{formErrors.inventoryNumber}</p>}
                </div>
                
                <div>
                  <Label htmlFor="edit-department">Département *</Label>
                  <Select 
                    value={editingMachine.department} 
                    onValueChange={(value) => handleEditInputChange("department", value)}
                  >
                    <SelectTrigger className={formErrors.department ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionner un département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dialysis Unit A">Unité de Dialyse A</SelectItem>
                      <SelectItem value="Dialysis Unit B">Unité de Dialyse B</SelectItem>
                      <SelectItem value="Dialysis Unit C">Unité de Dialyse C</SelectItem>
                      <SelectItem value="ICU">USI</SelectItem>
                      <SelectItem value="Emergency">Urgences</SelectItem>
                      <SelectItem value="Operating Room">Salle d'Opération</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.department && <p className="text-sm text-red-500 mt-1">{formErrors.department}</p>}
                </div>
                
                <div>
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select 
                    value={editingMachine.status} 
                    onValueChange={(value) => handleEditInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Actif</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false)
                      resetEditForm()
                    }}
                    disabled={isUpdating}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-teal-500 hover:bg-teal-600"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Mise à jour..." : "Mettre à Jour la Machine"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>Machines de Dialyse</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher des machines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les Statuts</SelectItem>
                    <SelectItem value="Active">Actif</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Machine</th>
                    <th className="text-left p-3 font-medium">N° Inventaire</th>
                    <th className="text-left p-3 font-medium">Département</th>
                    <th className="text-left p-3 font-medium">Statut</th>
                    <th className="text-left p-3 font-medium">Dernière Maintenance</th>
                    <th className="text-left p-3 font-medium">Prochaine Maintenance</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((machine) => (
                    <tr key={machine.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{machine.name}</td>
                      <td className="p-3">{machine.inventoryNumber}</td>
                      <td className="p-3">{machine.department}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            machine.status === "Active"
                              ? "default"
                              : machine.status === "Maintenance"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {machine.status === "Active" ? "Actif" : machine.status === "Maintenance" ? "Maintenance" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {machine.lastMaintenance 
                          ? new Date(machine.lastMaintenance).toLocaleDateString()
                          : "Non défini"
                        }
                      </td>
                      <td className="p-3">
                        {machine.nextMaintenance 
                          ? new Date(machine.nextMaintenance).toLocaleDateString()
                          : "Non défini"
                        }
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openEditDialog(machine)}
                            disabled={isUpdating || isDeleting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteMachine(machine.id, machine.name)}
                            disabled={isUpdating || isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMachines.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== "all" ? "Aucune machine ne correspond à vos filtres" : "Aucune machine trouvée"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Affichage des détails de suppression */}
        {error && deletionDetails && (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Impossible de Supprimer la Machine</h3>
                  <p className="text-red-700 mb-3">{error}</p>
                  
                  {showDeletionDetails ? (
                    <div className="bg-white p-3 rounded border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">Détails des Données Associées :</h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {deletionDetails.faults > 0 && (
                          <li>• <strong>{deletionDetails.faults}</strong> panne(s) - Consultez la page Pannes</li>
                        )}
                        {deletionDetails.alerts > 0 && (
                          <li>• <strong>{deletionDetails.alerts}</strong> alerte(s) - Consultez la page Alertes</li>
                        )}
                        {deletionDetails.maintenanceSchedule > 0 && (
                          <li>• <strong>{deletionDetails.maintenanceSchedule}</strong> planification(s) de maintenance - Consultez la page Maintenance</li>
                        )}
                        {deletionDetails.maintenanceControls > 0 && (
                          <li>• <strong>{deletionDetails.maintenanceControls}</strong> contrôle(s) de maintenance - Consultez la page Contrôles de Maintenance</li>
                        )}
                      </ul>
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Action requise :</strong> Supprimez ou réassignez toutes les données associées avant de supprimer cette machine.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDeletionDetails(true)}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Voir les Détails
                    </Button>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setError("")
                    setDeletionDetails(null)
                    setShowDeletionDetails(false)
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialogue de confirmation de suppression forcée */}
        <Dialog open={showForceDeleteDialog} onOpenChange={setShowForceDeleteDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Supprimer la Machine</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Êtes-vous sûr de vouloir supprimer la machine <strong>"{machineToDelete?.name}"</strong> ?
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Attention</h4>
                <p className="text-sm text-yellow-700">
                  Cette action ne peut pas être annulée. La machine et toutes ses données associées seront définitivement supprimées.
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowForceDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => confirmDeleteMachine(false)}
                  disabled={isDeleting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {isDeleting ? "Suppression..." : "Supprimer la Machine"}
                </Button>
                <Button 
                  onClick={() => confirmDeleteMachine(true)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Suppression..." : "Suppression Forcée (Toutes les Données)"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

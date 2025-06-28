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
      setError("Failed to load machines")
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (machineData) => {
    const errors = {}
    
    if (!machineData.name.trim()) {
      errors.name = "Machine name is required"
    }
    
    if (!machineData.inventoryNumber.trim()) {
      errors.inventoryNumber = "Inventory number is required"
    }
    
    if (!machineData.department) {
      errors.department = "Department is required"
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
      
      setSuccess("Machine created successfully!")
      setIsDialogOpen(false)
      setNewMachine({ name: "", inventoryNumber: "", department: "", status: "Active" })
      setFormErrors({})
      
      // Reload machines after a short delay to show success message
      setTimeout(() => {
        loadMachines()
      }, 1000)
    } catch (error) {
      console.error("Error creating machine:", error)
      setError(error.message || "Failed to create machine. Please try again.")
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
      
      setSuccess("Machine updated successfully!")
      setIsEditDialogOpen(false)
      setEditingMachine(null)
      setFormErrors({})
      
      // Reload machines after a short delay to show success message
      setTimeout(() => {
        loadMachines()
      }, 1000)
    } catch (error) {
      console.error("Error updating machine:", error)
      setError(error.message || "Failed to update machine. Please try again.")
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
        if (result.deletedData.faults > 0) deletedItems.push(`${result.deletedData.faults} fault(s)`);
        if (result.deletedData.alerts > 0) deletedItems.push(`${result.deletedData.alerts} alert(s)`);
        if (result.deletedData.maintenanceSchedule > 0) deletedItems.push(`${result.deletedData.maintenanceSchedule} maintenance schedule(s)`);
        if (result.deletedData.maintenanceControls > 0) deletedItems.push(`${result.deletedData.maintenanceControls} maintenance control(s)`);
        
        setSuccess(`Machine "${machineToDelete.name}" and all related data (${deletedItems.join(', ')}) deleted successfully!`)
      } else {
        setSuccess("Machine deleted successfully!")
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
            
            if (details.faults > 0) relatedData.push(`${details.faults} fault(s)`);
            if (details.alerts > 0) relatedData.push(`${details.alerts} alert(s)`);
            if (details.maintenanceSchedule > 0) relatedData.push(`${details.maintenanceSchedule} maintenance schedule(s)`);
            if (details.maintenanceControls > 0) relatedData.push(`${details.maintenanceControls} maintenance control(s)`);
            
            setError(`Cannot delete machine "${machineToDelete.name}" because it has related data: ${relatedData.join(', ')}. Please remove or reassign these items first.`)
            setDeletionDetails(details)
          } catch (parseError) {
            setError(`Cannot delete machine "${machineToDelete.name}" because it has related data. Please remove all associated faults, alerts, maintenance schedules, and controls first.`)
            setDeletionDetails(null)
          }
        } else {
          setError(`Cannot delete machine "${machineToDelete.name}" because it has related data. Please remove all associated faults, alerts, maintenance schedules, and controls first.`)
          setDeletionDetails(null)
        }
      } else {
        setError(error.message || "Failed to delete machine. Please try again.")
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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Machine Management</h1>
            <p className="text-gray-600">Manage dialysis machines and equipment</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-teal-500 hover:bg-teal-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Machine</DialogTitle>
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
                  <Label htmlFor="name">Machine Name *</Label>
                  <Input
                    id="name"
                    value={newMachine.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Fresenius 4008S"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="inventoryNumber">Inventory Number *</Label>
                  <Input
                    id="inventoryNumber"
                    value={newMachine.inventoryNumber}
                    onChange={(e) => handleInputChange("inventoryNumber", e.target.value)}
                    placeholder="e.g., INV-003"
                    className={formErrors.inventoryNumber ? "border-red-500" : ""}
                  />
                  {formErrors.inventoryNumber && <p className="text-sm text-red-500 mt-1">{formErrors.inventoryNumber}</p>}
                </div>
                
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select 
                    value={newMachine.department} 
                    onValueChange={(value) => handleInputChange("department", value)}
                  >
                    <SelectTrigger className={formErrors.department ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dialysis Unit A">Dialysis Unit A</SelectItem>
                      <SelectItem value="Dialysis Unit B">Dialysis Unit B</SelectItem>
                      <SelectItem value="Dialysis Unit C">Dialysis Unit C</SelectItem>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Operating Room">Operating Room</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.department && <p className="text-sm text-red-500 mt-1">{formErrors.department}</p>}
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newMachine.status} 
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
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
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-teal-500 hover:bg-teal-600"
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Add Machine"}
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
              <DialogTitle>Edit Machine</DialogTitle>
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
                  <Label htmlFor="edit-name">Machine Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingMachine.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                    placeholder="e.g., Fresenius 4008S"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="edit-inventoryNumber">Inventory Number *</Label>
                  <Input
                    id="edit-inventoryNumber"
                    value={editingMachine.inventoryNumber}
                    onChange={(e) => handleEditInputChange("inventoryNumber", e.target.value)}
                    placeholder="e.g., INV-003"
                    className={formErrors.inventoryNumber ? "border-red-500" : ""}
                  />
                  {formErrors.inventoryNumber && <p className="text-sm text-red-500 mt-1">{formErrors.inventoryNumber}</p>}
                </div>
                
                <div>
                  <Label htmlFor="edit-department">Department *</Label>
                  <Select 
                    value={editingMachine.department} 
                    onValueChange={(value) => handleEditInputChange("department", value)}
                  >
                    <SelectTrigger className={formErrors.department ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dialysis Unit A">Dialysis Unit A</SelectItem>
                      <SelectItem value="Dialysis Unit B">Dialysis Unit B</SelectItem>
                      <SelectItem value="Dialysis Unit C">Dialysis Unit C</SelectItem>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Operating Room">Operating Room</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.department && <p className="text-sm text-red-500 mt-1">{formErrors.department}</p>}
                </div>
                
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editingMachine.status} 
                    onValueChange={(value) => handleEditInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
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
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-teal-500 hover:bg-teal-600"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Machine"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>Dialysis Machines</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search machines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
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
                    <th className="text-left p-3 font-medium">Inventory #</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Last Maintenance</th>
                    <th className="text-left p-3 font-medium">Next Maintenance</th>
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
                          {machine.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {machine.lastMaintenance 
                          ? new Date(machine.lastMaintenance).toLocaleDateString()
                          : "Not set"
                        }
                      </td>
                      <td className="p-3">
                        {machine.nextMaintenance 
                          ? new Date(machine.nextMaintenance).toLocaleDateString()
                          : "Not set"
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
                  {searchTerm || statusFilter !== "all" ? "No machines match your filters" : "No machines found"}
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
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Cannot Delete Machine</h3>
                  <p className="text-red-700 mb-3">{error}</p>
                  
                  {showDeletionDetails ? (
                    <div className="bg-white p-3 rounded border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">Related Data Details:</h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {deletionDetails.faults > 0 && (
                          <li>• <strong>{deletionDetails.faults}</strong> fault(s) - Check the Faults page</li>
                        )}
                        {deletionDetails.alerts > 0 && (
                          <li>• <strong>{deletionDetails.alerts}</strong> alert(s) - Check the Alerts page</li>
                        )}
                        {deletionDetails.maintenanceSchedule > 0 && (
                          <li>• <strong>{deletionDetails.maintenanceSchedule}</strong> maintenance schedule(s) - Check the Maintenance page</li>
                        )}
                        {deletionDetails.maintenanceControls > 0 && (
                          <li>• <strong>{deletionDetails.maintenanceControls}</strong> maintenance control(s) - Check the Maintenance Controls page</li>
                        )}
                      </ul>
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Action required:</strong> Remove or reassign all related data before deleting this machine.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDeletionDetails(true)}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      View Details
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Machine</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete the machine <strong>"{machineToDelete?.name}"</strong>?
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warning</h4>
                <p className="text-sm text-yellow-700">
                  This action cannot be undone. The machine and all its related data will be permanently deleted.
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowForceDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => confirmDeleteMachine(false)}
                  disabled={isDeleting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Machine"}
                </Button>
                <Button 
                  onClick={() => confirmDeleteMachine(true)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Force Delete (All Data)"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Edit, Trash2, AlertCircle, CheckCircle, Save } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"

export default function UsersPage() {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [editFormErrors, setEditFormErrors] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  })
  const [editUser, setEditUser] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
    password: "",
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
    loadUsers()
  }, [router])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  const loadUsers = async () => {
    try {
      const usersData = await api.getUsers()
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Échec du chargement des utilisateurs")
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (formData, isEdit = false) => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = "Le nom est requis"
    }
    
    if (!formData.email.trim()) {
      errors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "L'email n'est pas valide"
    }
    
    if (!formData.role) {
      errors.role = "Le rôle est requis"
    }
    
    if (!isEdit && !formData.password.trim()) {
      errors.password = "Le mot de passe est requis"
    }
    
    if (isEdit) {
      setEditFormErrors(errors)
    } else {
      setFormErrors(errors)
    }
    
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    if (!validateForm(newUser)) {
      return
    }

    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      await api.createUser(newUser)
      setSuccess("Utilisateur créé avec succès !")
      setIsDialogOpen(false)
      setNewUser({ name: "", email: "", role: "", password: "" })
      setFormErrors({})
      
      setTimeout(() => {
        loadUsers()
      }, 1000)
    } catch (error) {
      console.error("Error creating user:", error)
      setError(error.message || "Échec de la création de l'utilisateur")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    
    if (!validateForm(editUser, true)) {
      return
    }

    setIsUpdating(true)
    setError("")
    setSuccess("")

    try {
      const updateData = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
      }
      
      if (editUser.password.trim()) {
        updateData.password = editUser.password
      }

      await api.updateUser(editUser.id, updateData)
      setSuccess("Utilisateur mis à jour avec succès !")
      setIsEditDialogOpen(false)
      setEditUser({ id: "", name: "", email: "", role: "", password: "" })
      setEditFormErrors({})
      
      setTimeout(() => {
        loadUsers()
      }, 1000)
    } catch (error) {
      console.error("Error updating user:", error)
      setError(error.message || "Échec de la mise à jour de l'utilisateur")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    setIsDeleting(true)
    setError("")
    setSuccess("")

    try {
      await api.deleteUser(userId)
      setSuccess("Utilisateur supprimé avec succès !")
      setSelectedUser(null)
      
      setTimeout(() => {
        loadUsers()
      }, 1000)
    } catch (error) {
      console.error("Error deleting user:", error)
      setError(error.message || "Échec de la suppression de l'utilisateur")
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (userData) => {
    setEditUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      password: "",
    })
    setEditFormErrors({})
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setNewUser({ name: "", email: "", role: "", password: "" })
    setFormErrors({})
    setError("")
    setSuccess("")
  }

  const resetEditForm = () => {
    setEditUser({ id: "", name: "", email: "", role: "", password: "" })
    setEditFormErrors({})
    setError("")
    setSuccess("")
  }

  const handleInputChange = (field, value, isEdit = false) => {
    if (isEdit) {
      setEditUser(prev => ({ ...prev, [field]: value }))
      if (editFormErrors[field]) {
        setEditFormErrors(prev => ({ ...prev, [field]: null }))
      }
    } else {
      setNewUser(prev => ({ ...prev, [field]: value }))
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: null }))
      }
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "technician":
        return "default"
      case "patient":
        return "secondary"
      default:
        return "outline"
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600">Gérer les utilisateurs du système et leurs rôles</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-teal-500 hover:bg-teal-600">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un Nouvel Utilisateur</DialogTitle>
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

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom Complet *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Entrez le nom complet"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Entrez l'adresse email"
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                </div>
                
                <div>
                  <Label htmlFor="role">Rôle *</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger className={formErrors.role ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="technician">Technicien</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && <p className="text-sm text-red-500 mt-1">{formErrors.role}</p>}
                </div>
                
                <div>
                  <Label htmlFor="password">Mot de Passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Entrez le mot de passe"
                    className={formErrors.password ? "border-red-500" : ""}
                  />
                  {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
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
                    {isCreating ? "Création..." : "Créer l'Utilisateur"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) resetEditForm()
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier l'Utilisateur</DialogTitle>
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

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nom Complet *</Label>
                <Input
                  id="edit-name"
                  value={editUser.name}
                  onChange={(e) => handleInputChange("name", e.target.value, true)}
                  placeholder="Entrez le nom complet"
                  className={editFormErrors.name ? "border-red-500" : ""}
                />
                {editFormErrors.name && <p className="text-sm text-red-500 mt-1">{editFormErrors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => handleInputChange("email", e.target.value, true)}
                  placeholder="Entrez l'adresse email"
                  className={editFormErrors.email ? "border-red-500" : ""}
                />
                {editFormErrors.email && <p className="text-sm text-red-500 mt-1">{editFormErrors.email}</p>}
              </div>
              
              <div>
                <Label htmlFor="edit-role">Rôle *</Label>
                <Select 
                  value={editUser.role} 
                  onValueChange={(value) => handleInputChange("role", value, true)}
                >
                  <SelectTrigger className={editFormErrors.role ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="technician">Technicien</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                {editFormErrors.role && <p className="text-sm text-red-500 mt-1">{editFormErrors.role}</p>}
              </div>
              
              <div>
                <Label htmlFor="edit-password">Nouveau Mot de Passe (laisser vide pour conserver l'actuel)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editUser.password}
                  onChange={(e) => handleInputChange("password", e.target.value, true)}
                  placeholder="Entrez le nouveau mot de passe"
                />
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
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? "Mise à jour..." : "Mettre à Jour l'Utilisateur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>Utilisateurs du Système</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher des utilisateurs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les Rôles</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="technician">Technicien</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
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
                    <th className="text-left p-3 font-medium">Nom</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Rôle</th>
                    <th className="text-left p-3 font-medium">Créé le</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{userData.name}</td>
                      <td className="p-3">{userData.email}</td>
                      <td className="p-3">
                        <Badge variant={getRoleBadgeVariant(userData.role)}>
                          {userData.role === "admin" ? "Administrateur" : 
                           userData.role === "technician" ? "Technicien" : 
                           userData.role === "patient" ? "Patient" : userData.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openEditDialog(userData)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setSelectedUser(userData)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'Utilisateur</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer <strong>{selectedUser?.name}</strong> ? 
                                  Cette action ne peut pas être annulée et supprimera toutes les données associées.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(selectedUser?.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? "Suppression..." : "Supprimer"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || roleFilter !== "all" ? "Aucun utilisateur ne correspond à vos filtres" : "Aucun utilisateur trouvé"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

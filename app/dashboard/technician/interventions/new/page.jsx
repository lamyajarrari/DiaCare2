"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, ArrowLeft, AlertCircle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { api } from "@/lib/api"

export default function NewInterventionPage() {
  const [user, setUser] = useState(null)
  const [machines, setMachines] = useState([])
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().split('T')[0],
    requestedIntervention: "",
    arrivalAtWorkshop: "",
    department: "",
    requestedBy: "",
    returnToService: "",
    equipmentDescription: "",
    inventoryNumber: "",
    problemDescription: "",
    interventionType: "Curative",
    datePerformed: "",
    tasksCompleted: "",
    partsReplaced: "",
    partDescription: "",
    price: "",
    timeSpent: "",
    status: "Pending",
    notifications: ""
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMachines, setIsLoadingMachines] = useState(true)
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
    loadMachines()
  }, [router])

  const loadMachines = async () => {
    try {
      const machinesData = await api.getMachines()
      setMachines(machinesData)
    } catch (error) {
      console.error("Error loading machines:", error)
    } finally {
      setIsLoadingMachines(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.requestDate) newErrors.requestDate = "Request date is required"
    if (!formData.requestedIntervention) newErrors.requestedIntervention = "Requested intervention is required"
    if (!formData.department) newErrors.department = "Department is required"
    if (!formData.requestedBy) newErrors.requestedBy = "Requested by is required"
    if (!formData.equipmentDescription) newErrors.equipmentDescription = "Equipment description is required"
    if (!formData.problemDescription) newErrors.problemDescription = "Problem description is required"
    if (!formData.interventionType) newErrors.interventionType = "Intervention type is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const interventionData = {
        ...formData,
        technician: user.name,
        technicianId: user.technicianId,
      }

      await api.createIntervention(interventionData)
      router.push("/dashboard/technician/interventions")
    } catch (error) {
      console.error("Error creating intervention:", error)
      setErrors({ submit: "Failed to create intervention. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMachineSelect = (machineId) => {
    const selectedMachine = machines.find(machine => machine.id === machineId)
    if (selectedMachine) {
      setFormData(prev => ({
        ...prev,
        equipmentDescription: selectedMachine.name,
        inventoryNumber: selectedMachine.inventoryNumber,
        department: selectedMachine.department
      }))
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={user.role} userName={user.name} />

      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Intervention Report</h1>
            <p className="text-gray-600">Fill out the technical intervention form</p>
          </div>
        </div>

        {errors.submit && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="requestDate">Request Date *</Label>
                  <Input
                    id="requestDate"
                    type="date"
                    value={formData.requestDate}
                    onChange={(e) => handleInputChange("requestDate", e.target.value)}
                    className={errors.requestDate ? "border-red-500" : ""}
                  />
                  {errors.requestDate && <p className="text-sm text-red-500 mt-1">{errors.requestDate}</p>}
                </div>

                <div>
                  <Label htmlFor="requestedIntervention">Requested Intervention *</Label>
                  <Input
                    id="requestedIntervention"
                    value={formData.requestedIntervention}
                    onChange={(e) => handleInputChange("requestedIntervention", e.target.value)}
                    placeholder="e.g., Repair dialysis machine, Preventive maintenance"
                    className={errors.requestedIntervention ? "border-red-500" : ""}
                  />
                  {errors.requestedIntervention && <p className="text-sm text-red-500 mt-1">{errors.requestedIntervention}</p>}
                </div>

                <div>
                  <Label htmlFor="requestedBy">Requested By *</Label>
                  <Input
                    id="requestedBy"
                    value={formData.requestedBy}
                    onChange={(e) => handleInputChange("requestedBy", e.target.value)}
                    placeholder="Name of person requesting the intervention"
                    className={errors.requestedBy ? "border-red-500" : ""}
                  />
                  {errors.requestedBy && <p className="text-sm text-red-500 mt-1">{errors.requestedBy}</p>}
                </div>

                <div>
                  <Label>Intervention Type *</Label>
                  <RadioGroup 
                    value={formData.interventionType} 
                    onValueChange={(value) => handleInputChange("interventionType", value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Preventive" id="preventive" />
                      <Label htmlFor="preventive">Preventive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Curative" id="curative" />
                      <Label htmlFor="curative">Curative</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Emergency" id="emergency" />
                      <Label htmlFor="emergency">Emergency</Label>
                    </div>
                  </RadioGroup>
                  {errors.interventionType && <p className="text-sm text-red-500 mt-1">{errors.interventionType}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Equipment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="machineSelect">Select Machine (Optional)</Label>
                  <Select onValueChange={handleMachineSelect} disabled={isLoadingMachines}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingMachines ? "Loading machines..." : "Choose a machine"} />
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
                  <Label htmlFor="equipmentDescription">Equipment Description *</Label>
                  <Input
                    id="equipmentDescription"
                    value={formData.equipmentDescription}
                    onChange={(e) => handleInputChange("equipmentDescription", e.target.value)}
                    placeholder="e.g., Fresenius 4008S Dialysis Machine"
                    className={errors.equipmentDescription ? "border-red-500" : ""}
                  />
                  {errors.equipmentDescription && <p className="text-sm text-red-500 mt-1">{errors.equipmentDescription}</p>}
                </div>

                <div>
                  <Label htmlFor="inventoryNumber">Inventory Number</Label>
                  <Input
                    id="inventoryNumber"
                    value={formData.inventoryNumber}
                    onChange={(e) => handleInputChange("inventoryNumber", e.target.value)}
                    placeholder="e.g., INV-2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger className={errors.department ? "border-red-500" : ""}>
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
                  {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Problem Description */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="problemDescription">Problem Description *</Label>
                  <Textarea
                    id="problemDescription"
                    value={formData.problemDescription}
                    onChange={(e) => handleInputChange("problemDescription", e.target.value)}
                    rows={4}
                    placeholder="Describe the problem in detail..."
                    className={errors.problemDescription ? "border-red-500" : ""}
                  />
                  {errors.problemDescription && <p className="text-sm text-red-500 mt-1">{errors.problemDescription}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="arrivalAtWorkshop">Arrival at Workshop</Label>
                  <Input
                    id="arrivalAtWorkshop"
                    type="datetime-local"
                    value={formData.arrivalAtWorkshop}
                    onChange={(e) => handleInputChange("arrivalAtWorkshop", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="datePerformed">Date Performed</Label>
                  <Input
                    id="datePerformed"
                    type="datetime-local"
                    value={formData.datePerformed}
                    onChange={(e) => handleInputChange("datePerformed", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="returnToService">Return to Service</Label>
                  <Input
                    id="returnToService"
                    type="datetime-local"
                    value={formData.returnToService}
                    onChange={(e) => handleInputChange("returnToService", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="timeSpent">Time Spent (hours)</Label>
                  <Input
                    id="timeSpent"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.timeSpent}
                    onChange={(e) => handleInputChange("timeSpent", e.target.value)}
                    placeholder="e.g., 2.5"
                  />
                </div>

                <div>
                  <Label htmlFor="notifications">Notifications de Rappel</Label>
                  <Select onValueChange={(value) => handleInputChange("notifications", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type de notification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3min">3 minutes</SelectItem>
                      <SelectItem value="3months">3 mois</SelectItem>
                      <SelectItem value="6months">6 mois</SelectItem>
                      <SelectItem value="1year">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Choisissez quand vous voulez recevoir une alerte de rappel pour cette intervention
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <CardTitle>Work Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tasksCompleted">Tasks Completed</Label>
                  <Textarea
                    id="tasksCompleted"
                    value={formData.tasksCompleted}
                    onChange={(e) => handleInputChange("tasksCompleted", e.target.value)}
                    rows={3}
                    placeholder="List all tasks performed..."
                  />
                </div>

                <div>
                  <Label htmlFor="partsReplaced">Parts Replaced</Label>
                  <Input
                    id="partsReplaced"
                    value={formData.partsReplaced}
                    onChange={(e) => handleInputChange("partsReplaced", e.target.value)}
                    placeholder="e.g., 2 filters, 1 pump"
                  />
                </div>

                <div>
                  <Label htmlFor="partDescription">Part Description</Label>
                  <Textarea
                    id="partDescription"
                    value={formData.partDescription}
                    onChange={(e) => handleInputChange("partDescription", e.target.value)}
                    rows={2}
                    placeholder="Description and provenance of parts..."
                  />
                </div>

                <div>
                  <Label htmlFor="price">Cost (MAD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="e.g., 1500.00"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-500 hover:bg-teal-600">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Intervention"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

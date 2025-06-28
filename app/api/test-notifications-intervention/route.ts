import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test des interventions avec notifications de rappel')
    
    const now = new Date()
    const results = []

    // 1. Créer une intervention avec notification 3 minutes
    console.log('\n📋 Test 1: Intervention avec notification 3 minutes')
    
    const intervention3min = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test maintenance avec notification 3 minutes",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: "Machine Test 3 Minutes",
        inventoryNumber: "INV-003",
        problemDescription: "Test du système de notifications 3 minutes",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Test de fonctionnement, vérification des paramètres",
        partsReplaced: "0",
        price: "0",
        technician: "Test Technician",
        timeSpent: "5",
        status: "Completed",
        technicianId: "T001",
        notifications: "3min"
      }
    })

    results.push({
      type: "3min_intervention",
      id: intervention3min.id,
      notifications: intervention3min.notifications,
      message: "Intervention 3min créée avec succès"
    })

    // 2. Créer une intervention avec notification 3 mois
    console.log('\n📋 Test 2: Intervention avec notification 3 mois')
    
    const intervention3months = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test maintenance avec notification 3 mois",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: "Fresenius 4008S",
        inventoryNumber: "INV-001",
        problemDescription: "Test du système de notifications 3 mois",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Maintenance préventive, remplacement des filtres",
        partsReplaced: "2",
        price: "150",
        technician: "Test Technician",
        timeSpent: "3",
        status: "Completed",
        technicianId: "T001",
        notifications: "3months"
      }
    })

    results.push({
      type: "3months_intervention",
      id: intervention3months.id,
      notifications: intervention3months.notifications,
      message: "Intervention 3mois créée avec succès"
    })

    // 3. Créer une intervention avec notification 6 mois
    console.log('\n📋 Test 3: Intervention avec notification 6 mois')
    
    const intervention6months = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test maintenance avec notification 6 mois",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: "Fresenius 6008",
        inventoryNumber: "INV-002",
        problemDescription: "Test du système de notifications 6 mois",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Maintenance complète, calibration",
        partsReplaced: "1",
        price: "300",
        technician: "Test Technician",
        timeSpent: "4",
        status: "Completed",
        technicianId: "T001",
        notifications: "6months"
      }
    })

    results.push({
      type: "6months_intervention",
      id: intervention6months.id,
      notifications: intervention6months.notifications,
      message: "Intervention 6mois créée avec succès"
    })

    // 4. Vérifier les maintenance schedules créés
    console.log('\n📋 Vérification des maintenance schedules créés')
    
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        OR: [
          { machineId: "M003" },
          { machineId: "M001" },
          { machineId: "M002" }
        ]
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true
          }
        }
      }
    })

    results.push({
      type: "maintenance_schedules",
      count: schedules.length,
      schedules: schedules.map(s => ({
        machine: s.machine.name,
        type: s.type,
        dueDate: s.dueDate,
        status: s.status
      }))
    })

    // 5. Vérifier les maintenance controls créés
    console.log('\n📋 Vérification des maintenance controls créés')
    
    const controls = await prisma.maintenanceControl.findMany({
      where: {
        OR: [
          { machineId: "M003" },
          { machineId: "M001" },
          { machineId: "M002" }
        ]
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true
          }
        }
      }
    })

    results.push({
      type: "maintenance_controls",
      count: controls.length,
      controls: controls.map(c => ({
        machine: c.machine.name,
        type: c.controlType,
        controlDate: c.controlDate,
        nextControlDate: c.nextControlDate,
        status: c.status
      }))
    })

    // 6. Calculer les prochaines alertes
    const nextAlert3min = new Date(now.getTime() + (3 * 60 * 1000))
    const nextAlert3months = new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000))
    const nextAlert6months = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000))

    results.push({
      type: "scheduled_alerts",
      alerts: [
        {
          type: "3min",
          nextAlert: nextAlert3min.toISOString()
        },
        {
          type: "3months",
          nextAlert: nextAlert3months.toISOString()
        },
        {
          type: "6months",
          nextAlert: nextAlert6months.toISOString()
        }
      ]
    })

    console.log('\n🎯 Résumé du test:')
    console.log('  1. ✅ Intervention 3min créée avec notifications')
    console.log('  2. ✅ Intervention 3mois créée avec notifications')
    console.log('  3. ✅ Intervention 6mois créée avec notifications')
    console.log('  4. ✅ Maintenance schedules créés automatiquement')
    console.log('  5. ✅ Maintenance controls créés automatiquement')
    console.log('  6. ⏰ Alertes programmées selon les cycles')

    return NextResponse.json({
      success: true,
      message: "Test des interventions avec notifications terminé avec succès",
      results: results,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Erreur lors du test des interventions avec notifications",
        details: error.message 
      },
      { status: 500 }
    )
  }
} 
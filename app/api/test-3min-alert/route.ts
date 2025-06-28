import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Création d\'une alerte de test avec cycle de 3 minutes...');

    const now = new Date();
    const nextControlDate = new Date(now.getTime() + (3 * 60 * 1000)); // +3 minutes

    // 1. Créer ou mettre à jour un contrôle de maintenance
    const maintenanceControl = await prisma.maintenanceControl.upsert({
      where: {
        id: 999 // ID de test
      },
      update: {
        controlDate: now,
        nextControlDate: nextControlDate,
        controlType: "3_minutes",
        status: "completed",
        machineId: "M001",
        technicianId: "T001",
        notes: "Test de contrôle avec cycle de 3 minutes"
      },
      create: {
        controlDate: now,
        nextControlDate: nextControlDate,
        controlType: "3_minutes",
        status: "completed",
        machineId: "M001",
        technicianId: "T001",
        notes: "Test de contrôle avec cycle de 3 minutes"
      }
    });

    // 2. Créer une alerte de rappel pour 3 minutes
    const alertMessage = `Rappel 3 minutes - Contrôle technique requis`;
    const alertType = "3-Minute Check";
    const requiredAction = "Effectuer un contrôle rapide de la machine après 3 minutes";

    const alert = await prisma.alert.create({
      data: {
        message: alertMessage,
        messageRole: "technician",
        type: alertType,
        requiredAction: requiredAction,
        priority: "high",
        timestamp: now,
        status: "active",
        machineId: "M001",
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
            department: true,
          },
        },
      },
    });

    // 3. Créer une maintenance schedule pour 3 minutes
    const maintenanceSchedule = await prisma.maintenanceSchedule.upsert({
      where: {
        id: 999 // ID de test
      },
      update: {
        type: "3-minute",
        tasks: JSON.stringify([
          "Vérification rapide des paramètres",
          "Contrôle des indicateurs",
          "Test de fonctionnement"
        ]),
        dueDate: nextControlDate.toISOString().split('T')[0],
        status: "Pending"
      },
      create: {
        type: "3-minute",
        tasks: JSON.stringify([
          "Vérification rapide des paramètres",
          "Contrôle des indicateurs", 
          "Test de fonctionnement"
        ]),
        dueDate: nextControlDate.toISOString().split('T')[0],
        status: "Pending",
        machineId: "M001"
      }
    });

    return NextResponse.json({
      success: true,
      message: `Alerte 3 minutes créée avec succès ! Prochaine vérification: ${nextControlDate.toLocaleString()}`,
      alert: {
        id: alert.id,
        message: alert.message,
        type: alert.type,
        priority: alert.priority,
        machine: alert.machine.name,
        timestamp: alert.timestamp
      },
      maintenanceControl: {
        id: maintenanceControl.id,
        controlDate: maintenanceControl.controlDate,
        nextControlDate: maintenanceControl.nextControlDate,
        controlType: maintenanceControl.controlType
      },
      maintenanceSchedule: {
        id: maintenanceSchedule.id,
        type: maintenanceSchedule.type,
        dueDate: maintenanceSchedule.dueDate,
        status: maintenanceSchedule.status
      }
    });

  } catch (error) {
    console.error("Erreur lors de la création de l'alerte 3 minutes:", error);
    return NextResponse.json(
      { error: "Failed to create 3-minute alert" },
      { status: 500 }
    );
  }
} 
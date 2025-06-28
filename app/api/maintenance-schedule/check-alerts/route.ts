import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Vérification des maintenances programmées via API...');

    const today = new Date();
    let alertsCreated = 0;
    const createdAlerts = [];

    // Récupérer toutes les maintenances programmées
    const maintenanceSchedules = await prisma.maintenanceSchedule.findMany({
      where: {
        status: "Pending"
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

    for (const schedule of maintenanceSchedules) {
      try {
        const dueDate = new Date(schedule.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        // Déterminer la priorité et le message selon le temps restant
        let priority = "low";
        let urgencyMessage = "";
        let shouldCreateAlert = false;

        if (daysUntilDue <= 0) {
          priority = "critical";
          urgencyMessage = `EN RETARD de ${Math.abs(daysUntilDue)} jour(s)`;
          shouldCreateAlert = true;
        } else if (daysUntilDue <= 7) {
          priority = "high";
          urgencyMessage = `dans ${daysUntilDue} jour(s)`;
          shouldCreateAlert = true;
        } else if (daysUntilDue <= 30) {
          priority = "medium";
          urgencyMessage = `dans ${daysUntilDue} jour(s)`;
          shouldCreateAlert = true;
        } else if (daysUntilDue <= 60) {
          priority = "low";
          urgencyMessage = `dans ${daysUntilDue} jour(s)`;
          shouldCreateAlert = true;
        }

        if (shouldCreateAlert) {
          // Vérifier si une alerte existe déjà
          const existingAlert = await prisma.alert.findFirst({
            where: {
              message: {
                contains: `Maintenance ${schedule.type} - ${schedule.machine.name}`
              },
              status: "active",
              machineId: schedule.machineId
            }
          });

          if (!existingAlert) {
            // Parser les tâches JSON
            let tasks = [];
            try {
              tasks = JSON.parse(schedule.tasks);
            } catch (e) {
              tasks = [schedule.tasks];
            }

            const alertMessage = `Maintenance ${schedule.type} - ${schedule.machine.name} ${urgencyMessage}`;
            const requiredAction = `Effectuer la maintenance ${schedule.type} : ${tasks.join(', ')}`;

            const alert = await prisma.alert.create({
              data: {
                message: alertMessage,
                messageRole: "technician",
                type: `Maintenance ${schedule.type}`,
                requiredAction: requiredAction,
                priority: priority,
                timestamp: new Date(),
                status: "active",
                machineId: schedule.machineId,
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

            createdAlerts.push({
              id: alert.id,
              message: alert.message,
              type: alert.type,
              priority: alert.priority,
              machine: alert.machine.name,
              urgencyMessage
            });

            alertsCreated++;
          }
        }

      } catch (error) {
        console.error(`Erreur lors du traitement de la maintenance ${schedule.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Vérification terminée. ${alertsCreated} nouvelles alertes créées.`,
      alertsCreated,
      totalSchedules: maintenanceSchedules.length,
      createdAlerts
    });

  } catch (error) {
    console.error("Erreur lors de la vérification des maintenances:", error);
    return NextResponse.json(
      { error: "Failed to check maintenance schedules" },
      { status: 500 }
    );
  }
} 
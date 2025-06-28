import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Vérification des contrôles de 3 minutes via API...');

    const now = new Date();
    let alertsCreated = 0;
    const createdAlerts = [];

    // 1. Vérifier les contrôles de maintenance avec cycle de 3 minutes
    const maintenanceControls = await prisma.maintenanceControl.findMany({
      where: {
        controlType: "3_minutes",
        status: "completed"
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
            department: true,
          },
        },
        technician: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    for (const control of maintenanceControls) {
      try {
        const nextControlDate = new Date(control.nextControlDate);
        const timeUntilNext = nextControlDate.getTime() - now.getTime();
        const minutesUntilNext = Math.ceil(timeUntilNext / (1000 * 60));

        // Vérifier si c'est le moment de créer une alerte
        let shouldCreateAlert = false;
        let priority = "low";
        let urgencyMessage = "";

        if (minutesUntilNext <= 0) {
          priority = "critical";
          urgencyMessage = `EN RETARD de ${Math.abs(minutesUntilNext)} minute(s)`;
          shouldCreateAlert = true;
        } else if (minutesUntilNext <= 1) {
          priority = "high";
          urgencyMessage = `dans ${minutesUntilNext} minute(s)`;
          shouldCreateAlert = true;
        } else if (minutesUntilNext <= 3) {
          priority = "medium";
          urgencyMessage = `dans ${minutesUntilNext} minute(s)`;
          shouldCreateAlert = true;
        }

        if (shouldCreateAlert) {
          // Vérifier si une alerte existe déjà
          const existingAlert = await prisma.alert.findFirst({
            where: {
              message: {
                contains: `Contrôle 3 minutes - ${control.machine.name}`
              },
              status: "active",
              machineId: control.machineId
            }
          });

          if (!existingAlert) {
            // Créer l'alerte
            const alertMessage = `Contrôle 3 minutes - ${control.machine.name} ${urgencyMessage}`;
            const alertType = "3-Minute Control";
            const requiredAction = `Effectuer le contrôle technique de 3 minutes sur ${control.machine.name}`;

            const alert = await prisma.alert.create({
              data: {
                message: alertMessage,
                messageRole: "technician",
                type: alertType,
                requiredAction: requiredAction,
                priority: priority,
                timestamp: now,
                status: "active",
                machineId: control.machineId,
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

            // Mettre à jour la date du prochain contrôle
            const newNextControlDate = new Date(now.getTime() + (3 * 60 * 1000)); // +3 minutes
            
            await prisma.maintenanceControl.update({
              where: { id: control.id },
              data: {
                nextControlDate: newNextControlDate,
                notes: `${control.notes || ''}\nAlerte créée le ${now.toLocaleString()}`
              }
            });
          }
        }

      } catch (error) {
        console.error(`Erreur lors du traitement du contrôle ${control.id}:`, error);
      }
    }

    // 2. Vérifier les maintenance schedules de 3 minutes
    const maintenanceSchedules = await prisma.maintenanceSchedule.findMany({
      where: {
        type: "3-minute",
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
        const timeUntilDue = dueDate.getTime() - now.getTime();
        const minutesUntilDue = Math.ceil(timeUntilDue / (1000 * 60));

        if (minutesUntilDue <= 0) {
          // Vérifier si une alerte existe déjà
          const existingAlert = await prisma.alert.findFirst({
            where: {
              message: {
                contains: `Maintenance 3-minute - ${schedule.machine.name}`
              },
              status: "active",
              machineId: schedule.machineId
            }
          });

          if (!existingAlert) {
            const alertMessage = `Maintenance 3-minute - ${schedule.machine.name} EN RETARD`;
            const alertType = "3-Minute Maintenance";
            
            let tasks = [];
            try {
              tasks = JSON.parse(schedule.tasks);
            } catch (e) {
              tasks = [schedule.tasks];
            }

            const requiredAction = `Effectuer la maintenance 3-minute: ${tasks.join(', ')}`;

            const alert = await prisma.alert.create({
              data: {
                message: alertMessage,
                messageRole: "technician",
                type: alertType,
                requiredAction: requiredAction,
                priority: "critical",
                timestamp: now,
                status: "active",
                machineId: schedule.machineId,
              },
            });

            createdAlerts.push({
              id: alert.id,
              message: alert.message,
              type: alert.type,
              priority: alert.priority,
              machine: schedule.machine.name,
              urgencyMessage: "EN RETARD"
            });

            alertsCreated++;
          }
        }
      } catch (error) {
        console.error(`Erreur lors du traitement du schedule ${schedule.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Vérification terminée. ${alertsCreated} nouvelles alertes créées.`,
      alertsCreated,
      totalControls: maintenanceControls.length,
      totalSchedules: maintenanceSchedules.length,
      createdAlerts
    });

  } catch (error) {
    console.error("Erreur lors de la vérification des contrôles 3 minutes:", error);
    return NextResponse.json(
      { error: "Failed to check 3-minute controls" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get('technicianId');

    // Construire la requête avec filtrage optionnel par technicien
    const whereClause: any = {};
    
    if (technicianId) {
      whereClause.technicianId = technicianId;
    }

    const interventions = await prisma.intervention.findMany({
      where: whereClause,
      include: {
        technicianUser: {
          select: {
            name: true,
            technicianId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(interventions);
  } catch (error) {
    console.error("Error fetching interventions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interventions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requestDate,
      requestedIntervention,
      arrivalAtWorkshop,
      department,
      requestedBy,
      returnToService,
      equipmentDescription,
      inventoryNumber,
      problemDescription,
      interventionType,
      datePerformed,
      tasksCompleted,
      partsReplaced,
      partDescription,
      price,
      technician,
      timeSpent,
      status,
      technicianId,
      notifications,
    } = body;

    // Validate required fields
    if (
      !requestDate ||
      !requestedIntervention ||
      !department ||
      !requestedBy ||
      !equipmentDescription
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create intervention
    const intervention = await prisma.intervention.create({
      data: {
        requestDate,
        requestedIntervention,
        arrivalAtWorkshop,
        department,
        requestedBy,
        returnToService,
        equipmentDescription,
        inventoryNumber: inventoryNumber || "",
        problemDescription: problemDescription || "",
        interventionType: interventionType || "Curative",
        datePerformed,
        tasksCompleted,
        partsReplaced,
        partDescription,
        price,
        technician,
        timeSpent,
        status: status || "Pending",
        technicianId,
        notifications: notifications || null,
      },
      include: {
        technicianUser: {
          select: {
            name: true,
            technicianId: true,
          },
        },
      },
    });

    // Créer une alerte immédiatement pour cette intervention
    if (notifications) {
      try {
        // Trouver la machine par inventoryNumber pour obtenir le machineId
        const machine = await prisma.machine.findFirst({
          where: { inventoryNumber: inventoryNumber || "" }
        });

        if (machine) {
          const alertMessage = `Nouvelle intervention #${intervention.id}: ${intervention.requestedIntervention}. Notifications: ${notifications}`;
          
          await prisma.alert.create({
            data: {
              message: alertMessage,
              messageRole: "technician",
              type: "intervention_created",
              requiredAction: "Vérifier et planifier le contrôle",
              priority: notifications === "3min" ? "critical" : "medium",
              timestamp: new Date(),
              status: "active",
              machineId: machine.id
            }
          });

          console.log(`✅ Alerte de création créée pour l'intervention #${intervention.id}`);
        } else {
          console.log(`⚠️ Machine non trouvée pour l'inventoryNumber: ${inventoryNumber}`);
        }
      } catch (alertError) {
        console.error("Erreur lors de la création de l'alerte:", alertError);
        // Ne pas faire échouer la création de l'intervention si l'alerte échoue
      }
    }

    // Si l'intervention a une datePerformed et des notifications, mettre à jour les dates de contrôle
    if (datePerformed && inventoryNumber && notifications) {
      try {
        // Trouver la machine par inventoryNumber
        const machine = await prisma.machine.findFirst({
          where: { inventoryNumber: inventoryNumber }
        });

        if (machine) {
          const performedDate = new Date(datePerformed);
          let nextControlDate = new Date(performedDate);

          // Calculer la prochaine date de contrôle selon le type de notification
          switch (notifications) {
            case "3min":
              nextControlDate.setMinutes(performedDate.getMinutes() + 3);
              break;
            case "3months":
              nextControlDate.setMonth(performedDate.getMonth() + 3);
              break;
            case "6months":
              nextControlDate.setMonth(performedDate.getMonth() + 6);
              break;
            case "1year":
              nextControlDate.setFullYear(performedDate.getFullYear() + 1);
              break;
            default:
              // Par défaut, ajouter 3 mois
              nextControlDate.setMonth(performedDate.getMonth() + 3);
          }

          // Convertir le type de notification en format maintenance schedule
          let scheduleType = "";
          let controlType = "";
          
          switch (notifications) {
            case "3min":
              scheduleType = "3-minute";
              controlType = "3_minutes";
              break;
            case "3months":
              scheduleType = "3-month";
              controlType = "3_months";
              break;
            case "6months":
              scheduleType = "6-month";
              controlType = "6_months";
              break;
            case "1year":
              scheduleType = "1-year";
              controlType = "1_year";
              break;
            default:
              scheduleType = "3-month";
              controlType = "3_months";
          }

          // Mettre à jour ou créer le maintenance schedule
          const existingSchedule = await prisma.maintenanceSchedule.findFirst({
            where: { 
              machineId: machine.id,
              type: scheduleType
            }
          });

          if (existingSchedule) {
            await prisma.maintenanceSchedule.update({
              where: { id: existingSchedule.id },
              data: {
                dueDate: nextControlDate.toISOString().split('T')[0],
                status: "Pending"
              }
            });
          } else {
            await prisma.maintenanceSchedule.create({
              data: {
                type: scheduleType,
                tasks: JSON.stringify([
                  "Vérification après intervention",
                  "Contrôle de fonctionnement",
                  "Maintenance préventive"
                ]),
                dueDate: nextControlDate.toISOString().split('T')[0],
                status: "Pending",
                machineId: machine.id
              }
            });
          }

          // Mettre à jour ou créer le maintenance control
          const existingControl = await prisma.maintenanceControl.findFirst({
            where: {
              machineId: machine.id,
              controlType: controlType
            }
          });

          if (existingControl) {
            await prisma.maintenanceControl.update({
              where: { id: existingControl.id },
              data: {
                controlDate: performedDate,
                nextControlDate: nextControlDate,
                status: "completed",
                notes: `Mise à jour automatique après intervention #${intervention.id} (${notifications})`
              }
            });
          } else {
            await prisma.maintenanceControl.create({
              data: {
                machineId: machine.id,
                technicianId: technicianId || "T001",
                controlDate: performedDate,
                controlType: controlType,
                nextControlDate: nextControlDate,
                status: "completed",
                notes: `Créé automatiquement après intervention #${intervention.id} (${notifications})`
              }
            });
          }

          // Mettre à jour la machine
          await prisma.machine.update({
            where: { id: machine.id },
            data: {
              lastMaintenance: performedDate,
              nextMaintenance: nextControlDate
            }
          });

          console.log(`✅ Dates de contrôle mises à jour pour la machine ${machine.name}`);
          console.log(`  - Dernière maintenance: ${performedDate.toLocaleString()}`);
          console.log(`  - Prochaine maintenance: ${nextControlDate.toLocaleString()}`);
          console.log(`  - Type de notification: ${notifications}`);
        }
      } catch (updateError) {
        console.error("Erreur lors de la mise à jour des dates de contrôle:", updateError);
        // Ne pas faire échouer la création de l'intervention si la mise à jour échoue
      }
    }

    return NextResponse.json(intervention, { status: 201 });
  } catch (error) {
    console.error("Error creating intervention:", error);
    return NextResponse.json(
      { error: "Failed to create intervention" },
      { status: 500 }
    );
  }
}

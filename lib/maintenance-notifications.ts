import { prisma } from './db';
import { sendMaintenanceEmail } from './email';

// Types pour les contrôles de maintenance
export interface MaintenanceControlData {
  machineId: string;
  technicianId: string;
  controlType: '3_months' | '6_months' | '1_year';
  controlDate: Date;
  notes?: string;
}

// Calculer la prochaine date de contrôle selon le type
export const calculateNextControlDate = (controlType: string, controlDate: Date): Date => {
  const nextDate = new Date(controlDate);
  
  switch (controlType) {
    case '3_months':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case '6_months':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case '1_year':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      throw new Error(`Type de contrôle invalide: ${controlType}`);
  }
  
  return nextDate;
};

// Créer un nouveau contrôle de maintenance
export async function createMaintenanceControl(data: {
  machineId: string;
  technicianId: string;
  controlType: string;
  controlDate: Date;
  notes?: string;
}) {
  try {
    // Calculate next control date based on control type
    const nextControlDate = calculateNextControlDate(data.controlType, data.controlDate);

    const control = await prisma.maintenanceControl.create({
      data: {
        machineId: data.machineId,
        technicianId: data.technicianId,
        controlDate: data.controlDate,
        controlType: data.controlType,
        nextControlDate: nextControlDate,
        notes: data.notes,
        status: 'completed',
      },
      include: {
        machine: true,
        technician: true,
      },
    });

    // Check if the next control date is overdue and create an alert
    if (nextControlDate < new Date()) {
      try {
        await prisma.alert.create({
          data: {
            message: `Maintenance control overdue for machine ${control.machine.name}`,
            messageRole: 'technician',
            type: 'maintenance_control',
            requiredAction: `Perform ${data.controlType.replace('_', ' ')} maintenance control`,
            priority: 'high',
            timestamp: new Date(),
            status: 'active',
            machineId: data.machineId,
          },
        });
        console.log(`Alert created for overdue maintenance control on machine ${control.machine.name}`);
      } catch (alertError) {
        console.error('Error creating maintenance control alert:', alertError);
      }
    }

    return control;
  } catch (error) {
    console.error('Error creating maintenance control:', error);
    throw error;
  }
}

// Vérifier les contrôles de maintenance à venir (dans les 7 prochains jours)
export const checkUpcomingMaintenanceControls = async () => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingControls = await prisma.maintenanceControl.findMany({
      where: {
        nextControlDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
        status: 'completed', // Seulement les contrôles complétés qui ont une prochaine date
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

    return upcomingControls;
  } catch (error) {
    console.error('Erreur lors de la vérification des contrôles à venir:', error);
    throw error;
  }
};

// Vérifier les contrôles de maintenance en retard
export const checkOverdueMaintenanceControls = async () => {
  try {
    const today = new Date();

    const overdueControls = await prisma.maintenanceControl.findMany({
      where: {
        nextControlDate: {
          lt: today,
        },
        status: 'completed', // Seulement les contrôles complétés qui sont en retard
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

    return overdueControls;
  } catch (error) {
    console.error('Erreur lors de la vérification des contrôles en retard:', error);
    throw error;
  }
};

// Envoyer les notifications de maintenance
export async function sendMaintenanceNotifications() {
  try {
    console.log('🔍 Checking for maintenance controls...');

    // Get all technicians with their controls
    const technicians = await prisma.user.findMany({
      where: {
        role: 'technician',
      },
      include: {
        maintenanceControls: {
          where: {
            OR: [
              // Overdue controls
              {
                nextControlDate: {
                  lt: new Date(),
                },
                status: 'completed',
              },
              // Upcoming controls (within 7 days)
              {
                nextControlDate: {
                  gte: new Date(),
                  lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                status: 'completed',
              },
            ],
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
          orderBy: {
            nextControlDate: 'asc',
          },
        },
      },
    });

    const results = [];

    for (const technician of technicians) {
      if (technician.maintenanceControls.length === 0) {
        continue;
      }

      // Prepare controls data for email
      const controls = technician.maintenanceControls.map(control => ({
        id: control.id,
        machine: control.machine,
        controlType: control.controlType,
        nextControlDate: control.nextControlDate,
        isOverdue: control.nextControlDate < new Date(),
      }));

      // Create alerts for overdue controls
      for (const control of controls) {
        if (control.isOverdue) {
          try {
            await prisma.alert.create({
              data: {
                message: `Maintenance control overdue for machine ${control.machine.name}`,
                messageRole: 'technician',
                type: 'maintenance_control',
                requiredAction: `Perform ${control.controlType.replace('_', ' ')} maintenance control`,
                priority: 'high',
                timestamp: new Date(),
                status: 'active',
                machineId: control.machine.inventoryNumber, // Using inventory number as machineId
              },
            });
            console.log(`Alert created for overdue control on machine ${control.machine.name}`);
          } catch (alertError) {
            console.error('Error creating alert for overdue control:', alertError);
          }
        }
      }

      // Send email notification
      try {
        const emailResult = await sendMaintenanceEmail({
          technician: {
            name: technician.name,
            email: technician.email,
          },
          controls,
        });

        results.push({
          technicianName: technician.name,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          controlsCount: controls.length,
        });

        if (emailResult.success) {
          console.log(`✅ Email sent to ${technician.name} for ${controls.length} controls`);
        } else {
          console.error(`❌ Failed to send email to ${technician.name}:`, emailResult.error);
        }
      } catch (error) {
        console.error(`❌ Error sending email to ${technician.name}:`, error);
        results.push({
          technicianName: technician.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          controlsCount: controls.length,
        });
      }
    }

    console.log(`📧 Maintenance notifications completed. Processed ${results.length} technicians.`);
    return results;
  } catch (error) {
    console.error('❌ Error in sendMaintenanceNotifications:', error);
    throw error;
  }
}

// Marquer un contrôle comme terminé
export const markControlAsCompleted = async (controlId: number, notes?: string) => {
  try {
    const control = await prisma.maintenanceControl.update({
      where: { id: controlId },
      data: {
        status: 'completed',
        notes: notes,
        updatedAt: new Date(),
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

    return control;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contrôle:', error);
    throw error;
  }
};

// Obtenir tous les contrôles de maintenance
export const getAllMaintenanceControls = async () => {
  try {
    const controls = await prisma.maintenanceControl.findMany({
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
      orderBy: {
        nextControlDate: 'asc',
      },
    });

    return controls;
  } catch (error) {
    console.error('Erreur lors de la récupération des contrôles:', error);
    throw error;
  }
}; 
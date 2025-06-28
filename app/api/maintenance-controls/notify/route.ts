import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMaintenanceEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Triggering maintenance control notifications...");

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Récupérer tous les contrôles qui nécessitent une notification
    const controlsToNotify = await prisma.maintenanceControl.findMany({
      where: {
        OR: [
          // Contrôles en retard
          {
            nextControlDate: {
              lt: today,
            },
            status: "completed",
          },
          // Contrôles à venir dans les 7 prochains jours
          {
            nextControlDate: {
              gte: today,
              lte: sevenDaysFromNow,
            },
            status: "completed",
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
        technician: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        nextControlDate: "asc",
      },
    });

    if (controlsToNotify.length === 0) {
      return NextResponse.json({
        message: "No maintenance controls require notification",
        count: 0,
        results: [],
      });
    }

    console.log(`📧 Found ${controlsToNotify.length} controls requiring notification`);

    // Grouper par technicien
    const technicianNotifications = new Map();

    for (const control of controlsToNotify) {
      const technicianId = control.technicianId;
      
      if (!technicianNotifications.has(technicianId)) {
        technicianNotifications.set(technicianId, {
          technician: control.technician,
          controls: [],
        });
      }

      const isOverdue = control.nextControlDate < today;
      technicianNotifications.get(technicianId).controls.push({
        id: control.id,
        machine: control.machine,
        controlType: control.controlType,
        nextControlDate: control.nextControlDate,
        isOverdue,
      });
    }

    // Envoyer les notifications par technicien
    const results = [];
    
    for (const [technicianId, data] of technicianNotifications) {
      try {
        const emailResult = await sendMaintenanceEmail({
          technician: data.technician,
          controls: data.controls,
        });

        results.push({
          technicianId,
          technicianName: data.technician.name,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          controlsCount: data.controls.length,
        });

        if (emailResult.success) {
          console.log(`✅ Email sent to ${data.technician.name} for ${data.controls.length} controls`);
        } else {
          console.error(`❌ Failed to send email to ${data.technician.name}:`, emailResult.error);
        }
      } catch (error) {
        console.error(`❌ Error sending email to ${data.technician.name}:`, error);
        results.push({
          technicianId,
          technicianName: data.technician.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          controlsCount: data.controls.length,
        });
      }
    }

    console.log(`📧 Maintenance control notifications completed. Processed ${results.length} technicians.`);

    return NextResponse.json({
      message: "Maintenance control notifications sent",
      count: controlsToNotify.length,
      results,
    });
  } catch (error) {
    console.error("❌ Error in maintenance control notifications:", error);
    return NextResponse.json(
      { error: "Failed to send maintenance control notifications" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { sendMaintenanceNotifications } from "@/lib/maintenance-notifications";

export async function GET(request: NextRequest) {
  try {
    // Vérifier le token de sécurité (optionnel)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Vous pouvez ajouter une vérification de token ici pour sécuriser l'endpoint
    // if (token !== process.env.CRON_SECRET_TOKEN) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Envoyer les notifications de maintenance
    const results = await sendMaintenanceNotifications();
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Maintenance notifications cron job completed. Success: ${successCount}, Failures: ${failureCount}`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Maintenance notifications sent. Success: ${successCount}, Failures: ${failureCount}`,
      results: results,
    });
  } catch (error) {
    console.error("Error in maintenance notifications cron job:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to send maintenance notifications",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Même logique que GET pour les appels POST
  return GET(request);
} 
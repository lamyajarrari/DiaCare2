import { NextRequest, NextResponse } from "next/server";
import { checkInterventionReminders } from "@/scripts/check-intervention-reminders";

export async function GET(request: NextRequest) {
  try {
    // Vérifier une clé secrète pour sécuriser l'endpoint
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');
    
    if (secretKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🕐 Cron job triggered: Checking intervention reminders");
    
    // Exécuter la vérification des rappels
    await checkInterventionReminders();
    
    return NextResponse.json(
      { success: true, message: "Reminder check completed" }
    );
  } catch (error) {
    console.error("Error in reminder check cron job:", error);
    return NextResponse.json(
      { error: "Failed to check reminders" },
      { status: 500 }
    );
  }
} 
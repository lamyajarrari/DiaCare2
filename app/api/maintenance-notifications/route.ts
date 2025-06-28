import { NextRequest, NextResponse } from "next/server";
import { sendMaintenanceNotifications } from "@/lib/maintenance-notifications";

export async function POST(request: NextRequest) {
  try {
    // Send maintenance notifications
    const results = await sendMaintenanceNotifications();
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Maintenance notifications sent. Success: ${successCount}, Failures: ${failureCount}`,
      results: results,
    });
  } catch (error) {
    console.error("Error sending maintenance notifications:", error);
    return NextResponse.json(
      { error: "Failed to send maintenance notifications" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get upcoming and overdue controls for preview
    const { checkUpcomingMaintenanceControls, checkOverdueMaintenanceControls } = await import("@/lib/maintenance-notifications");
    
    const upcomingControls = await checkUpcomingMaintenanceControls();
    const overdueControls = await checkOverdueMaintenanceControls();
    
    return NextResponse.json({
      upcoming: upcomingControls,
      overdue: overdueControls,
      total: upcomingControls.length + overdueControls.length,
    });
  } catch (error) {
    console.error("Error checking maintenance controls:", error);
    return NextResponse.json(
      { error: "Failed to check maintenance controls" },
      { status: 500 }
    );
  }
} 
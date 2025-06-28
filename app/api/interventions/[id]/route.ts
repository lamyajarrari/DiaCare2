import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const intervention = await prisma.intervention.findUnique({
      where: {
        id: parseInt(id),
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

    if (!intervention) {
      return NextResponse.json(
        { error: "Intervention not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(intervention);
  } catch (error) {
    console.error("Error fetching intervention:", error);
    return NextResponse.json(
      { error: "Failed to fetch intervention" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ...otherFields } = body;

    // Validate that the intervention exists
    const existingIntervention = await prisma.intervention.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingIntervention) {
      return NextResponse.json(
        { error: "Intervention not found" },
        { status: 404 }
      );
    }

    // Update the intervention
    const updatedIntervention = await prisma.intervention.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...(status && { status }),
        ...otherFields,
        updatedAt: new Date(),
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

    return NextResponse.json(updatedIntervention);
  } catch (error) {
    console.error("Error updating intervention:", error);
    return NextResponse.json(
      { error: "Failed to update intervention" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Validate that the intervention exists
    const existingIntervention = await prisma.intervention.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingIntervention) {
      return NextResponse.json(
        { error: "Intervention not found" },
        { status: 404 }
      );
    }

    // Delete the intervention
    await prisma.intervention.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json({ message: "Intervention deleted successfully" });
  } catch (error) {
    console.error("Error deleting intervention:", error);
    return NextResponse.json(
      { error: "Failed to delete intervention" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        patientId: true,
        technicianId: true,
        adminId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    const { email, password, role, name, patientId, technicianId, adminId } = body;

    // Validate that the user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      email,
      role,
      name,
      patientId,
      technicianId,
      adminId,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        patientId: true,
        technicianId: true,
        adminId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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
    // Validate that the user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has related data
    const relatedData = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        faults: true,
        interventions: true,
      },
    });

    if (relatedData && (relatedData.faults.length > 0 || relatedData.interventions.length > 0)) {
      return NextResponse.json(
        { error: "Cannot delete user with existing faults or interventions" },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 
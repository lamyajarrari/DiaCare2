import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientName,
      medicalRecordNumber,
      sessionDate,
      sessionTimeFrom,
      sessionTimeTo,
      responsibleDoctor,
      dialysisFee,
      generatorDialyzer,
      medConsumables,
      nursingCare,
      adminFees,
      taxPercentage,
      paymentMethod,
      paymentReference,
      observations,
      subTotal,
      taxAmount,
      totalToPay,
    } = body;

    // Validate required fields
    if (!patientName || !medicalRecordNumber || !sessionDate || !responsibleDoctor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        patientName,
        medicalRecordNumber,
        sessionDate: new Date(sessionDate),
        sessionTimeFrom: sessionTimeFrom || null,
        sessionTimeTo: sessionTimeTo || null,
        responsibleDoctor,
        dialysisFee: parseFloat(dialysisFee) || 0,
        generatorDialyzer: parseFloat(generatorDialyzer) || 0,
        medConsumables: parseFloat(medConsumables) || 0,
        nursingCare: parseFloat(nursingCare) || 0,
        adminFees: parseFloat(adminFees) || 0,
        taxPercentage: parseFloat(taxPercentage) || 0,
        paymentMethod: paymentMethod.join(", "),
        paymentReference: paymentReference || "",
        observations: observations || "",
        subTotal: parseFloat(subTotal) || 0,
        taxAmount: parseFloat(taxAmount) || 0,
        totalToPay: parseFloat(totalToPay) || 0,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Invoice generated successfully", 
        invoice 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
} 
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create users
  const users = [
    {
      email: "patient@diacare.com",
      password: hashedPassword,
      role: "patient",
      name: "douha",
      patientId: "P001",
    },
    {
      email: "tech@diacare.com",
      password: hashedPassword,
      role: "technician",
      name: "mehdi",
      technicianId: "T001",
    },
    {
      email: "admin@diacare.com",
      password: hashedPassword,
      role: "admin",
      name: "lamya",
      adminId: "A001",
    },
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  // Create machines
  const machines = [
    {
      id: "M001",
      name: "Fresenius 4008S",
      inventoryNumber: "INV-001",
      department: "Dialysis Unit A",
      status: "Active",
      lastMaintenance: new Date("2025-06-16"),
      nextMaintenance: new Date("2025-09-16"),
    },
    {
      id: "M002",
      name: "Fresenius 6008",
      inventoryNumber: "INV-002",
      department: "Dialysis Unit B",
      status: "Active",
      lastMaintenance: new Date("2025-05-20"),
      nextMaintenance: new Date("2025-08-20"),
    },
  ];

  for (const machine of machines) {
    await prisma.machine.create({ data: machine });
  }

  // Create faults
  const faults = [
    {
      date: "2025-06-12",
      faultType: "Hydraulic Alarm",
      description: "Internal leakage detected",
      downtime: "2 hours",
      rootCause: "Worn-out seal",
      correctiveAction: "Hydraulic seal replaced",
      status: "Resolved",
      patientId: "P001",
      machineId: "M001",
    },
    {
      date: "2025-06-10",
      faultType: "Pressure Alarm",
      description: "High transmembrane pressure detected",
      downtime: "1.5 hours",
      rootCause: "Blocked dialyzer",
      correctiveAction: "Dialyzer replaced",
      status: "Resolved",
      patientId: "P001",
      machineId: "M002",
    },
  ];

  for (const fault of faults) {
    await prisma.fault.create({ data: fault });
  }

  // Create alerts
  const alerts = [
    {
      message: "Improve conductivity",
      messageRole: "Adjust total salt concentration in patient",
      type: "Warning",
      requiredAction: "Adjust to 138–145 mmol/l before starting",
      priority: "medium",
      timestamp: new Date("2025-06-21T14:15:00Z"),
      machineId: "M001",
      status: "active",
    },
    {
      message: "Air leakage",
      messageRole: "Air bubbles or blockage in venous line",
      type: "Blood Circuit Alarm",
      requiredAction: "Check bubble trap, detectors, and closure",
      priority: "high",
      timestamp: new Date("2025-06-21T13:30:00Z"),
      machineId: "M002",
      status: "active",
    },
  ];

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert });
  }

  // Create interventions
  const interventions = [
    {
      requestDate: "2025-06-15",
      requestedIntervention: "Routine maintenance check",
      arrivalAtWorkshop: "2025-06-16",
      department: "Dialysis Unit A",
      requestedBy: "Dr. Wilson",
      returnToService: "2025-06-16",
      equipmentDescription: "Fresenius 4008S",
      inventoryNumber: "INV-001",
      problemDescription: "Scheduled preventive maintenance",
      interventionType: "Preventive",
      datePerformed: "2025-06-16",
      tasksCompleted: "Filter replacement, electrical connections check",
      partsReplaced: "2",
      partDescription: "Water filter, air filter",
      price: "150",
      technician: "Sarah Johnson",
      timeSpent: "3",
      status: "Completed",
      technicianId: "T001",
    },
  ];

  for (const intervention of interventions) {
    await prisma.intervention.create({ data: intervention });
  }

  // Create maintenance schedule
  const maintenanceSchedule = [
    {
      machineId: "M001",
      type: "3-month",
      tasks: JSON.stringify([
        "Replace filters / Clean if necessary",
        "Check motorized clamps",
        "Tighten electrical connections",
      ]),
      dueDate: "2025-09-16",
      status: "Pending",
    },
    {
      machineId: "M002",
      type: "6-month",
      tasks: JSON.stringify([
        "Full calibration with calibrated tools",
        "Inspect hydraulic components",
        "Firmware updates via Fresenius service",
      ]),
      dueDate: "2025-11-20",
      status: "Pending",
    },
  ];

  for (const schedule of maintenanceSchedule) {
    await prisma.maintenanceSchedule.create({ data: schedule });
  }

  // Create maintenance controls
  const maintenanceControls = [
    {
      machineId: "M001",
      technicianId: "T001",
      controlDate: new Date("2025-06-15"),
      controlType: "3_months",
      nextControlDate: new Date("2025-09-15"),
      status: "completed",
      notes: "Contrôle de routine effectué, machine en bon état",
    },
    {
      machineId: "M002",
      technicianId: "T001",
      controlDate: new Date("2025-05-20"),
      controlType: "6_months",
      nextControlDate: new Date("2025-11-20"),
      status: "completed",
      notes: "Calibration effectuée, remplacement des filtres",
    },
    {
      machineId: "M001",
      technicianId: "T001",
      controlDate: new Date("2025-03-15"),
      controlType: "1_year",
      nextControlDate: new Date("2026-03-15"),
      status: "completed",
      notes: "Contrôle annuel complet, mise à jour du firmware",
    },
  ];

  for (const control of maintenanceControls) {
    await prisma.maintenanceControl.create({ data: control });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

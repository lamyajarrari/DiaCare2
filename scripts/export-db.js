const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportAll() {
  const users = await prisma.user.findMany();
  const machines = await prisma.machine.findMany();
  const faults = await prisma.fault.findMany();
  const alerts = await prisma.alert.findMany();
  const interventions = await prisma.intervention.findMany();
  const maintenanceControls = await prisma.maintenanceControl.findMany();
  const maintenanceSchedules = await prisma.maintenanceSchedule.findMany();
  const invoices = await prisma.invoice.findMany();

  const allData = {
    users,
    machines,
    faults,
    alerts,
    interventions,
    maintenanceControls,
    maintenanceSchedules,
    invoices,
  };

  fs.writeFileSync('db-export.json', JSON.stringify(allData, null, 2));
  console.log('✅ Exported all data to db-export.json');
  await prisma.$disconnect();
}

exportAll(); 
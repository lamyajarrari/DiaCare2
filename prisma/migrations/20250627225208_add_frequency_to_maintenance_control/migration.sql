-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT,
    "technicianId" TEXT,
    "adminId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inventoryNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faults" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "faultType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "downtime" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "correctiveAction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,

    CONSTRAINT "faults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "messageRole" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "requiredAction" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "machineId" TEXT NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" SERIAL NOT NULL,
    "requestDate" TEXT NOT NULL,
    "requestedIntervention" TEXT NOT NULL,
    "arrivalAtWorkshop" TEXT,
    "department" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "returnToService" TEXT,
    "equipmentDescription" TEXT NOT NULL,
    "inventoryNumber" TEXT NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "datePerformed" TEXT,
    "tasksCompleted" TEXT,
    "partsReplaced" TEXT,
    "partDescription" TEXT,
    "price" TEXT,
    "technician" TEXT,
    "timeSpent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "technicianId" TEXT,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedule" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "tasks" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "machineId" TEXT NOT NULL,

    CONSTRAINT "maintenance_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_controls" (
    "id" SERIAL NOT NULL,
    "machineId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "controlDate" TIMESTAMP(3) NOT NULL,
    "controlType" TEXT NOT NULL,
    "nextControlDate" TIMESTAMP(3) NOT NULL,
    "frequencyInMonths" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "patientName" TEXT NOT NULL,
    "medicalRecordNumber" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "sessionTimeFrom" TEXT,
    "sessionTimeTo" TEXT,
    "responsibleDoctor" TEXT NOT NULL,
    "dialysisFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "generatorDialyzer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "medConsumables" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nursingCare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adminFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL,
    "paymentReference" TEXT,
    "observations" TEXT,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalToPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_patientId_key" ON "users"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "users_technicianId_key" ON "users"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "users_adminId_key" ON "users"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "machines_inventoryNumber_key" ON "machines"("inventoryNumber");

-- AddForeignKey
ALTER TABLE "faults" ADD CONSTRAINT "faults_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("patientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faults" ADD CONSTRAINT "faults_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("technicianId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedule" ADD CONSTRAINT "maintenance_schedule_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_controls" ADD CONSTRAINT "maintenance_controls_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_controls" ADD CONSTRAINT "maintenance_controls_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("technicianId") ON DELETE RESTRICT ON UPDATE CASCADE;

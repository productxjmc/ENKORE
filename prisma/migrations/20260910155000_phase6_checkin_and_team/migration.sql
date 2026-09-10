-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "ticketPurchaseId" TEXT;

-- CreateTable
CREATE TABLE "MusicianTeamMember" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicianTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MusicianTeamMember_musicianId_idx" ON "MusicianTeamMember"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_ticketPurchaseId_key" ON "Attendance"("ticketPurchaseId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_ticketPurchaseId_fkey" FOREIGN KEY ("ticketPurchaseId") REFERENCES "TicketPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicianTeamMember" ADD CONSTRAINT "MusicianTeamMember_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

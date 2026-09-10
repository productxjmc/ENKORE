-- CreateEnum
CREATE TYPE "InterestSignalKind" AS ENUM ('NOTIFY');

-- CreateTable
CREATE TABLE "InterestSignal" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "fanId" TEXT,
    "fanEmail" TEXT NOT NULL,
    "fanName" TEXT,
    "kind" "InterestSignalKind" NOT NULL DEFAULT 'NOTIFY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterestSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterestSignal_musicianId_idx" ON "InterestSignal"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestSignal_musicianId_fanEmail_kind_key" ON "InterestSignal"("musicianId", "fanEmail", "kind");

-- AddForeignKey
ALTER TABLE "InterestSignal" ADD CONSTRAINT "InterestSignal_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestSignal" ADD CONSTRAINT "InterestSignal_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

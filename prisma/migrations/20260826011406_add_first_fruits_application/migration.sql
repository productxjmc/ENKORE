-- CreateEnum
CREATE TYPE "FirstFruitsStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "FirstFruitsApplication" (
    "id" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "location" TEXT,
    "email" TEXT NOT NULL,
    "songLink" TEXT NOT NULL,
    "fanReachAnswer" TEXT NOT NULL,
    "attributionSource" TEXT,
    "status" "FirstFruitsStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirstFruitsApplication_pkey" PRIMARY KEY ("id")
);

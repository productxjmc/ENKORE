-- CreateEnum
CREATE TYPE "SeasonOfSingingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "SeasonOfSingingApplication" (
    "id" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "location" TEXT,
    "songLink" TEXT NOT NULL,
    "christianGenre" "ChristianGenre",
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "bio" TEXT,
    "howHeard" TEXT,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToLaunchTerms" BOOLEAN NOT NULL DEFAULT false,
    "status" "SeasonOfSingingStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonOfSingingApplication_pkey" PRIMARY KEY ("id")
);

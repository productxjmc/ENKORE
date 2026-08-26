-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "MusicianCountry" AS ENUM ('SOUTH_AFRICA', 'NIGERIA', 'KENYA', 'GHANA', 'UGANDA', 'TANZANIA', 'RWANDA', 'ZAMBIA', 'ZIMBABWE', 'BOTSWANA', 'NAMIBIA', 'MOZAMBIQUE', 'CAMEROON', 'COTE_DIVOIRE', 'SENEGAL', 'MALAWI', 'ESWATINI', 'LESOTHO', 'OTHER');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('DOCS_PENDING', 'DOCS_SUBMITTED', 'LAUNCHED');

-- CreateEnum
CREATE TYPE "RequirementsStatus" AS ENUM ('NONE', 'PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('SOUNDCHECK', 'MAINSTAGE', 'HEADLINER');

-- CreateEnum
CREATE TYPE "ChristianGenre" AS ENUM ('GOSPEL', 'WORSHIP_AND_PRAISE', 'CHRISTIAN_HIP_HOP', 'CONTEMPORARY_CHRISTIAN', 'CHRISTIAN_RNB', 'CHRISTIAN_ROCK', 'HYMNS_AND_TRADITIONAL', 'CHRISTIAN_AFROBEATS', 'INSPIRATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunicationPreference" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'NEVER');

-- CreateEnum
CREATE TYPE "BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "FollowSource" AS ENUM ('LIVE_EVENT_QR', 'WEBSITE', 'SEARCH', 'DIRECT');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('MUSICIAN', 'FAN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'SOLD_OUT', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('QR_CODE', 'MANUAL');

-- CreateEnum
CREATE TYPE "BookingEventType" AS ENUM ('WEDDING', 'CORPORATE', 'CHURCH_SERVICE', 'CONCERT', 'PRIVATE_PARTY', 'FESTIVAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TourCampaignStatus" AS ENUM ('ACTIVE', 'FUNDED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'HELD_IN_ESCROW', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ZAR', 'USD', 'NGN', 'GHS', 'KES', 'XOF');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYFAST', 'CAPITEC_PAY', 'YOCO', 'CARD', 'KYSHI');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "MerchType" AS ENUM ('T_SHIRT', 'HOODIE', 'CAP', 'POSTER', 'VINYL');

-- CreateEnum
CREATE TYPE "MerchStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "SubFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('PAYFAST', 'KYSHI', 'PAYPAL', 'YOCO', 'MANUAL');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutFrequency" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AffiliateTier" AS ENUM ('COMMUNITY', 'MINISTRY', 'AMBASSADOR');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'PAYFAST', 'MOBILE_MONEY', 'CASH');

-- CreateEnum
CREATE TYPE "PreRegStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('PENDING', 'CONTACTED', 'JOINED', 'DECLINED');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('REVENUE', 'FOLLOWERS', 'TRACKS', 'DOWNLOADS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Musician" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "musicianName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT,
    "profileImage" TEXT,
    "storefrontUrl" TEXT,
    "feePlanId" TEXT,
    "payoutPercentage" DOUBLE PRECISION DEFAULT 10,
    "payoutFrequency" "PayoutFrequency",
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tracksUploaded" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "country" "MusicianCountry",
    "socialLinks" JSONB,
    "streamingLinks" JSONB,
    "videoLinks" JSONB,
    "lastLoginAt" TIMESTAMP(3),
    "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'DOCS_PENDING',
    "onboardingDocs" JSONB,
    "requirementsStatus" "RequirementsStatus" NOT NULL DEFAULT 'NONE',
    "requirementsNotes" TEXT,
    "requirementsSubmittedAt" TIMESTAMP(3),
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "selectedPlan" "SubscriptionTier",
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Musician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "coverArt" TEXT,
    "audioFileUrl" TEXT NOT NULL,
    "previewUrl" TEXT,
    "basePrice" DECIMAL(10,2),
    "payWhatYouWant" BOOLEAN NOT NULL DEFAULT true,
    "minimumPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "downloadsCount" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "releaseDate" DATE,
    "genre" TEXT,
    "duration" TEXT,
    "albumName" TEXT,
    "trackNumber" INTEGER,
    "featuredArtists" TEXT[],
    "lyrics" TEXT,
    "songwriters" TEXT[],
    "producers" TEXT[],
    "bpm" INTEGER,
    "key" TEXT,
    "mood" TEXT,
    "isrc" TEXT,
    "metadataConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "metadataConfirmationAt" TIMESTAMP(3),
    "metadataNotes" TEXT,
    "ownershipVerified" BOOLEAN NOT NULL DEFAULT false,
    "collaboratorsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT,
    "email" TEXT NOT NULL,
    "location" TEXT,
    "socialLink" TEXT,
    "christianGenre" "ChristianGenre",
    "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "purchasesCount" INTEGER NOT NULL DEFAULT 0,
    "communicationPreference" "CommunicationPreference" NOT NULL DEFAULT 'MONTHLY',
    "isTopFan" BOOLEAN NOT NULL DEFAULT false,
    "badgeLevel" "BadgeLevel",
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "fanEmail" TEXT,
    "fanName" TEXT,
    "source" "FollowSource" NOT NULL DEFAULT 'DIRECT',
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanWallPost" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "fanName" TEXT NOT NULL,
    "fanEmail" TEXT,
    "message" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanWallPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "fanId" TEXT,
    "subject" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "fanEmail" TEXT,
    "fanName" TEXT,
    "musicianEmail" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "venue" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "coverImage" TEXT,
    "ticketPrice" DECIMAL(10,2) NOT NULL,
    "totalTickets" INTEGER NOT NULL,
    "ticketsSold" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "revenueGenerated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPurchase" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "fanName" TEXT,
    "fanEmail" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'CONFIRMED',
    "ticketCode" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "fanId" TEXT,
    "fanName" TEXT NOT NULL,
    "fanEmail" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "locationData" JSONB,
    "source" "AttendanceSource" NOT NULL DEFAULT 'QR_CODE',
    "discountCodeIssued" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingEnquiry" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "musicianEmail" TEXT,
    "slotId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventDate" DATE NOT NULL,
    "eventType" "BookingEventType",
    "eventTime" TEXT,
    "venue" TEXT,
    "budget" TEXT,
    "organizerName" TEXT NOT NULL,
    "organizerEmail" TEXT NOT NULL,
    "organizerPhone" TEXT,
    "message" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "musicianEmail" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "title" TEXT,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourCampaign" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "city" TEXT NOT NULL,
    "venue" TEXT,
    "proposedDate" DATE,
    "fundingGoal" DECIMAL(12,2) NOT NULL,
    "currentFunding" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "contributorCount" INTEGER NOT NULL DEFAULT 0,
    "status" "TourCampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "escrowAccountId" TEXT,
    "deadline" DATE NOT NULL,
    "ticketPrice" DECIMAL(10,2),
    "artistConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "venueConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "conditionsMet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourContribution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fanId" TEXT,
    "musicianId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fanName" TEXT,
    "fanEmail" TEXT,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "escrowTransactionId" TEXT,
    "refundProcessed" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "fanId" TEXT,
    "trackId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "platformFee" DECIMAL(10,2),
    "musicianEarnings" DECIMAL(10,2),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYFAST',
    "paymentReference" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "fanEmail" TEXT,
    "fanName" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchandise" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MerchType" NOT NULL,
    "priceZar" DECIMAL(10,2),
    "priceNgn" DECIMAL(10,2),
    "priceUsd" DECIMAL(10,2),
    "imageUrl" TEXT,
    "sizes" TEXT[],
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isOnDemand" BOOLEAN NOT NULL DEFAULT true,
    "unitsSold" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "MerchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchandise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchandiseOrder" (
    "id" TEXT NOT NULL,
    "merchandiseId" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "size" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "fanName" TEXT,
    "fanEmail" TEXT,
    "shippingAddress" JSONB,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "trackingNumber" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchandiseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanSubscription" (
    "id" TEXT NOT NULL,
    "fanId" TEXT,
    "musicianId" TEXT NOT NULL,
    "fanName" TEXT,
    "fanEmail" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "SubFrequency" NOT NULL DEFAULT 'MONTHLY',
    "status" "SubStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "paymentReference" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicianSubscription" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "status" "SubStatus" NOT NULL DEFAULT 'PENDING',
    "subscriptionType" TEXT NOT NULL DEFAULT 'monthly',
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "paymentReference" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicianSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "musicianEmail" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "tier" "SubscriptionTier",
    "gateway" "PaymentGateway",
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paymentReference" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT,
    "grossRevenue" DECIMAL(12,2),
    "platformFee" DECIMAL(12,2),
    "netAmount" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicianPayoutInfo" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicianPayoutInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "termMonths" INTEGER NOT NULL DEFAULT 12,
    "monthlyFee" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "upfrontPaymentMonths" INTEGER NOT NULL DEFAULT 1,
    "platformCommissionPercentage" DOUBLE PRECISION NOT NULL,
    "payoutFrequency" "PayoutFrequency" NOT NULL,
    "payoutDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "tier" "AffiliateTier" NOT NULL DEFAULT 'COMMUNITY',
    "foundingMember" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "ministryName" TEXT,
    "ministryRole" TEXT,
    "joinedAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastClickIp" TEXT,
    "lastClickAt" TIMESTAMP(3),
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "pendingEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEarningsPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "residualEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "upfrontBonusEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "churchMultiplierEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionPerConversion" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
    "payoutMethod" "PayoutMethod",
    "bankName" TEXT,
    "accountNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicianPreRegistration" (
    "id" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "spotifyUrl" TEXT,
    "christianGenre" "ChristianGenre",
    "referralCode" TEXT,
    "status" "PreRegStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicianPreRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicianNomination" (
    "id" TEXT NOT NULL,
    "musicianName" TEXT NOT NULL,
    "musicianEmail" TEXT,
    "musicianSocialLink" TEXT,
    "fanName" TEXT,
    "fanEmail" TEXT NOT NULL,
    "reason" TEXT,
    "status" "NominationStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicianNomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanRewardSurvey" (
    "id" TEXT NOT NULL,
    "fanEmail" TEXT,
    "fanPhone" TEXT,
    "rewardPreferences" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanRewardSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarlyAccessSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'explore_music',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarlyAccessSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphicDesigner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "portfolioLink" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[],
    "priceRange" TEXT NOT NULL,
    "profileImage" TEXT,
    "location" TEXT,
    "instagram" TEXT,
    "whatsapp" TEXT,
    "yearsExperience" INTEGER,
    "featuredWork" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphicDesigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DECIMAL(12,2) NOT NULL,
    "currentValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "startDate" DATE,
    "endDate" DATE NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Musician_userId_key" ON "Musician"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Musician_email_key" ON "Musician"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Musician_storefrontUrl_key" ON "Musician"("storefrontUrl");

-- CreateIndex
CREATE INDEX "Musician_storefrontUrl_idx" ON "Musician"("storefrontUrl");

-- CreateIndex
CREATE INDEX "Track_musicianId_idx" ON "Track"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "Track_musicianId_slug_key" ON "Track"("musicianId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Fan_userId_key" ON "Fan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Fan_email_key" ON "Fan"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_fanId_musicianId_key" ON "Follow"("fanId", "musicianId");

-- CreateIndex
CREATE INDEX "FanWallPost_musicianId_idx" ON "FanWallPost"("musicianId");

-- CreateIndex
CREATE INDEX "Message_musicianId_idx" ON "Message"("musicianId");

-- CreateIndex
CREATE INDEX "Message_fanId_idx" ON "Message"("fanId");

-- CreateIndex
CREATE INDEX "Event_musicianId_idx" ON "Event"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPurchase_ticketCode_key" ON "TicketPurchase"("ticketCode");

-- CreateIndex
CREATE INDEX "TicketPurchase_eventId_idx" ON "TicketPurchase"("eventId");

-- CreateIndex
CREATE INDEX "TicketPurchase_musicianId_idx" ON "TicketPurchase"("musicianId");

-- CreateIndex
CREATE INDEX "Attendance_eventId_idx" ON "Attendance"("eventId");

-- CreateIndex
CREATE INDEX "BookingEnquiry_musicianId_idx" ON "BookingEnquiry"("musicianId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_musicianId_idx" ON "AvailabilitySlot"("musicianId");

-- CreateIndex
CREATE INDEX "TourCampaign_musicianId_idx" ON "TourCampaign"("musicianId");

-- CreateIndex
CREATE INDEX "TourContribution_campaignId_idx" ON "TourContribution"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_paymentReference_key" ON "Purchase"("paymentReference");

-- CreateIndex
CREATE INDEX "Purchase_musicianId_idx" ON "Purchase"("musicianId");

-- CreateIndex
CREATE INDEX "Purchase_trackId_idx" ON "Purchase"("trackId");

-- CreateIndex
CREATE INDEX "Merchandise_musicianId_idx" ON "Merchandise"("musicianId");

-- CreateIndex
CREATE INDEX "MerchandiseOrder_musicianId_idx" ON "MerchandiseOrder"("musicianId");

-- CreateIndex
CREATE INDEX "FanSubscription_musicianId_idx" ON "FanSubscription"("musicianId");

-- CreateIndex
CREATE INDEX "MusicianSubscription_musicianId_idx" ON "MusicianSubscription"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_paymentReference_key" ON "SubscriptionPayment"("paymentReference");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_musicianId_idx" ON "SubscriptionPayment"("musicianId");

-- CreateIndex
CREATE INDEX "Payout_musicianId_idx" ON "Payout"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicianPayoutInfo_musicianId_key" ON "MusicianPayoutInfo"("musicianId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "Affiliate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_email_key" ON "Affiliate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_referralCode_key" ON "Affiliate"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "EarlyAccessSignup_email_key" ON "EarlyAccessSignup"("email");

-- CreateIndex
CREATE INDEX "Goal_musicianId_idx" ON "Goal"("musicianId");

-- AddForeignKey
ALTER TABLE "Musician" ADD CONSTRAINT "Musician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Musician" ADD CONSTRAINT "Musician_feePlanId_fkey" FOREIGN KEY ("feePlanId") REFERENCES "FeePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fan" ADD CONSTRAINT "Fan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanWallPost" ADD CONSTRAINT "FanWallPost_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPurchase" ADD CONSTRAINT "TicketPurchase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPurchase" ADD CONSTRAINT "TicketPurchase_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPurchase" ADD CONSTRAINT "TicketPurchase_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEnquiry" ADD CONSTRAINT "BookingEnquiry_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEnquiry" ADD CONSTRAINT "BookingEnquiry_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourCampaign" ADD CONSTRAINT "TourCampaign_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourContribution" ADD CONSTRAINT "TourContribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TourCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourContribution" ADD CONSTRAINT "TourContribution_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourContribution" ADD CONSTRAINT "TourContribution_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merchandise" ADD CONSTRAINT "Merchandise_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseOrder" ADD CONSTRAINT "MerchandiseOrder_merchandiseId_fkey" FOREIGN KEY ("merchandiseId") REFERENCES "Merchandise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseOrder" ADD CONSTRAINT "MerchandiseOrder_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseOrder" ADD CONSTRAINT "MerchandiseOrder_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanSubscription" ADD CONSTRAINT "FanSubscription_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanSubscription" ADD CONSTRAINT "FanSubscription_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicianSubscription" ADD CONSTRAINT "MusicianSubscription_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "MusicianSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicianPayoutInfo" ADD CONSTRAINT "MusicianPayoutInfo_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

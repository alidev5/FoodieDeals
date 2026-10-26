-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "paidOutAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "closesAtMinute" INTEGER,
ADD COLUMN     "prepMinutesMax" INTEGER,
ADD COLUMN     "prepMinutesMin" INTEGER,
ADD COLUMN     "priceLevel" INTEGER;

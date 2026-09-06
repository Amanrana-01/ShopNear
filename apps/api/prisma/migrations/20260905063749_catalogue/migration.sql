-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('PIECE', 'WEIGHT', 'VOLUME', 'PACK');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'USUALLY_AVAILABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AvailabilitySource" AS ENUM ('MERCHANT_MANUAL', 'RESERVATION_CONFIRMED', 'RESERVATION_REJECTED', 'SEED', 'AUTO_DECAY');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameGu" TEXT NOT NULL,
    "brand" TEXT,
    "categoryId" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "defaultUnitLabel" TEXT NOT NULL,
    "mrp" DOUBLE PRECISION,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "searchKeywords" TEXT[],
    "isLooseGood" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopInventory" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "availability" "Availability" NOT NULL DEFAULT 'UNKNOWN',
    "availabilityUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availabilitySource" "AvailabilitySource" NOT NULL DEFAULT 'SEED',
    "confirmCount" INTEGER NOT NULL DEFAULT 0,
    "rejectCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShopInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StarterCatalogueItem" (
    "id" TEXT NOT NULL,
    "shopType" "ShopType" NOT NULL,
    "productId" TEXT NOT NULL,
    "suggestedPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StarterCatalogueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "ShopInventory_shopId_productId_idx" ON "ShopInventory"("shopId", "productId");

-- CreateIndex
CREATE INDEX "ShopInventory_productId_availability_idx" ON "ShopInventory"("productId", "availability");

-- CreateIndex
CREATE UNIQUE INDEX "ShopInventory_shopId_productId_key" ON "ShopInventory"("shopId", "productId");

-- CreateIndex
CREATE INDEX "StarterCatalogueItem_shopType_idx" ON "StarterCatalogueItem"("shopType");

-- CreateIndex
CREATE UNIQUE INDEX "StarterCatalogueItem_shopType_productId_key" ON "StarterCatalogueItem"("shopType", "productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopInventory" ADD CONSTRAINT "ShopInventory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopInventory" ADD CONSTRAINT "ShopInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarterCatalogueItem" ADD CONSTRAINT "StarterCatalogueItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Typo-tolerant product search: "ata" -> "Aashirvaad Atta 5 kg" (spec §8).
CREATE INDEX IF NOT EXISTS product_name_trgm ON "Product" USING GIN (name gin_trgm_ops);

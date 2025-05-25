-- CreateTable
CREATE TABLE "MLRecommendation" (
    "id" TEXT NOT NULL,
    "soilDataId" TEXT NOT NULL,
    "recommendedCrop" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "alternatives" JSONB NOT NULL,
    "advice" JSONB NOT NULL,
    "modelType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MLRecommendation_soilDataId_key" ON "MLRecommendation"("soilDataId");

-- CreateIndex
CREATE INDEX "MLRecommendation_soilDataId_idx" ON "MLRecommendation"("soilDataId");

-- AddForeignKey
ALTER TABLE "MLRecommendation" ADD CONSTRAINT "MLRecommendation_soilDataId_fkey" FOREIGN KEY ("soilDataId") REFERENCES "SoilData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

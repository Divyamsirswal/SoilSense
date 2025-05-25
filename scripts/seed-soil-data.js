// @ts-check
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get a random number between min and max (inclusive)
function getRandomNumber(min, max, decimals = 0) {
    const random = Math.random() * (max - min) + min;
    return Number(random.toFixed(decimals));
}

// Generate a date between start and end
function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random soil data entries
async function generateSoilData() {
    try {
        // Get all farms
        const farms = await prisma.farm.findMany();

        if (farms.length === 0) {
            console.log('No farms found. Please create farms first.');
            process.exit(1);
        }

        console.log(`Found ${farms.length} farms. Generating soil data...`);

        // Define date ranges - last 3 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);

        let totalEntries = 0;

        // For each farm, create multiple soil data entries
        for (const farm of farms) {
            // Get devices for this farm
            const devices = await prisma.device.findMany({
                where: {
                    farmId: farm.id
                }
            });
            
            if (devices.length === 0) {
                console.log(`No devices found for farm: ${farm.name}. Skipping...`);
                continue;
            }
            
            console.log(`Found ${devices.length} devices for farm: ${farm.name}`);
            
            // Get zones for this farm
            const zones = await prisma.zone.findMany({
                where: {
                    farmId: farm.id
                }
            });
            
            // Generate between 20-30 entries per farm
            const numEntries = getRandomNumber(20, 30);
            
            for (let i = 0; i < numEntries; i++) {
                // Generate a random date within our range
                const timestamp = getRandomDate(startDate, endDate);
                
                // Pick a random device
                const device = devices[Math.floor(Math.random() * devices.length)];
                
                // Randomly assign to a zone (if any)
                const zone = zones.length > 0 ? (Math.random() > 0.3 ? zones[Math.floor(Math.random() * zones.length)] : null) : null;
                
                // Generate soil data values with appropriate ranges
                const soilData = await prisma.soilData.create({
                    data: {
                        farmId: farm.id,
                        deviceId: device.id,
                        zoneId: zone?.id || null,
                        timestamp,
                        pH: getRandomNumber(5.5, 7.8, 1),
                        nitrogen: getRandomNumber(20, 60),
                        phosphorus: getRandomNumber(15, 40),
                        potassium: getRandomNumber(140, 250),
                        moisture: getRandomNumber(40, 75),
                        temperature: getRandomNumber(16, 32, 1),
                        organicMatter: getRandomNumber(2, 8, 1),
                        conductivity: getRandomNumber(0.2, 2, 1),
                        salinity: getRandomNumber(0.1, 0.8, 1),
                        depth: getRandomNumber(5, 30),
                        quality: ["POOR", "FAIR", "GOOD", "EXCELLENT"][Math.floor(Math.random() * 4)]
                    },
                });
                
                totalEntries++;
                
                // Randomly create ML recommendations for some entries (50% chance)
                if (Math.random() > 0.5) {
                    await createMLRecommendation(soilData);
                }
            }
            
            console.log(`Generated ${numEntries} soil data entries for farm: ${farm.name}`);
        }
        
        console.log(`Successfully created ${totalEntries} soil data entries across ${farms.length} farms.`);
    } catch (error) {
        console.error('Error seeding soil data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Generate ML recommendations for a soil data entry
async function createMLRecommendation(soilData) {
    try {
        const cropOptions = [
            'Corn', 'Wheat', 'Soybeans', 'Rice', 'Potatoes', 
            'Tomatoes', 'Lettuce', 'Carrots', 'Cabbage',
            'Spinach', 'Onions', 'Peppers', 'Beans'
        ];
        
        // Pick a recommended crop
        const recommendedCrop = cropOptions[Math.floor(Math.random() * cropOptions.length)];
        
        // Generate alternatives (2-3 alternative crops)
        const alternatives = [];
        const numAlternatives = getRandomNumber(2, 3);
        const usedCrops = [recommendedCrop];
        
        for (let i = 0; i < numAlternatives; i++) {
            let crop;
            do {
                crop = cropOptions[Math.floor(Math.random() * cropOptions.length)];
            } while (usedCrops.includes(crop));
            
            usedCrops.push(crop);
            alternatives.push({
                crop,
                confidence: getRandomNumber(55, 85, 1)
            });
        }
        
        // Generate advice
        const advice = {
            fertilizer: {
                recommendation: `Apply ${getRandomNumber(20, 50)} kg/ha of ${["NPK", "Urea", "Phosphate", "Potash"][Math.floor(Math.random() * 4)]} fertilizer.`,
                reasoning: `Based on ${soilData.nitrogen} ppm nitrogen and ${soilData.phosphorus} ppm phosphorus levels.`
            },
            irrigation: {
                recommendation: `Maintain soil moisture at ${getRandomNumber(55, 65)}% for optimal growth.`,
                schedule: `Water every ${getRandomNumber(2, 5)} days, adjusting based on weather conditions.`
            },
            soilManagement: {
                recommendation: soilData.pH < 6.5 ? "Add agricultural lime to increase soil pH." : (soilData.pH > 7.2 ? "Add sulfur to decrease soil pH." : "Maintain current soil pH levels."),
                additionalSteps: "Consider adding organic matter to improve soil structure."
            }
        };
        
        await prisma.mLRecommendation.create({
            data: {
                soilDataId: soilData.id,
                recommendedCrop,
                confidence: getRandomNumber(75, 95, 1),
                alternatives,
                advice,
                modelType: ["RandomForest", "NeuralNetwork", "XGBoost", "SVMClassifier"][Math.floor(Math.random() * 4)]
            }
        });
        
    } catch (error) {
        console.error('Error creating ML recommendation:', error);
    }
}

// Run the seeding function
generateSoilData()
    .then(() => {
        console.log('Soil data seeding completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to seed soil data:', error);
        process.exit(1);
    }); 
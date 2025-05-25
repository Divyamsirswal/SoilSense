// Script to generate sample weather data for farms
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedWeatherData() {
    try {
        console.log('Starting to seed weather data...');

        // Get all farms
        const farms = await prisma.farm.findMany();

        if (farms.length === 0) {
            console.log('No farms found. Please create some farms first.');
            return;
        }

        console.log(`Found ${farms.length} farms. Generating weather data...`);

        // Delete existing weather data to avoid duplicates
        await prisma.weatherData.deleteMany({});

        for (const farm of farms) {
            console.log(`Generating weather data for farm: ${farm.name}`);

            // Generate current weather
            await prisma.weatherData.create({
                data: {
                    farmId: farm.id,
                    date: new Date(),
                    temperature: getRandomNumber(20, 35),
                    humidity: getRandomNumber(40, 90),
                    precipitation: getRandomNumber(0, 100),
                    windSpeed: getRandomNumber(5, 25),
                    windDirection: getRandomNumber(0, 360),
                    pressure: getRandomNumber(990, 1030),
                    uvIndex: getRandomNumber(1, 10),
                    visibility: getRandomNumber(5, 20),
                    cloudCover: getRandomNumber(0, 100),
                    conditions: getRandomCondition(),
                    forecast: false,
                }
            });

            // Generate historical weather (past 10 days)
            for (let i = 1; i <= 10; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                await prisma.weatherData.create({
                    data: {
                        farmId: farm.id,
                        date: date,
                        temperature: getRandomNumber(18, 33),
                        humidity: getRandomNumber(40, 90),
                        precipitation: getRandomNumber(0, 100),
                        windSpeed: getRandomNumber(5, 25),
                        windDirection: getRandomNumber(0, 360),
                        pressure: getRandomNumber(990, 1030),
                        uvIndex: getRandomNumber(1, 10),
                        visibility: getRandomNumber(5, 20),
                        cloudCover: getRandomNumber(0, 100),
                        conditions: getRandomCondition(),
                        forecast: false,
                    }
                });
            }

            // Generate forecast weather (next 7 days)
            for (let i = 1; i <= 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);

                await prisma.weatherData.create({
                    data: {
                        farmId: farm.id,
                        date: date,
                        temperature: getRandomNumber(20, 35),
                        humidity: getRandomNumber(40, 90),
                        precipitation: getRandomNumber(0, 100),
                        windSpeed: getRandomNumber(5, 25),
                        windDirection: getRandomNumber(0, 360),
                        pressure: getRandomNumber(990, 1030),
                        uvIndex: getRandomNumber(1, 10),
                        visibility: getRandomNumber(5, 20),
                        cloudCover: getRandomNumber(0, 100),
                        conditions: getRandomCondition(),
                        forecast: true,
                    }
                });
            }
        }

        console.log('Weather data seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding weather data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Helper function to generate random number within range
function getRandomNumber(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

// Helper function to generate random weather condition
function getRandomCondition() {
    const conditions = [
        'Sunny',
        'Partly Cloudy',
        'Cloudy',
        'Scattered Showers',
        'Rain Showers',
        'Heavy Rain',
        'Thunderstorms',
        'Clear'
    ];

    return conditions[Math.floor(Math.random() * conditions.length)];
}

// Run the seeding function
seedWeatherData()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error executing seed script:', error);
        process.exit(1);
    }); 
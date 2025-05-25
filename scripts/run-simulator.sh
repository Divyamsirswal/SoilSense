#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}     SoilGuardian Hardware Simulator Runner    ${NC}"
echo -e "${GREEN}===============================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if farm ID was provided
if [ "$#" -ne 1 ]; then
    echo -e "${YELLOW}Usage: $0 <farm_id>${NC}"
    echo -e "${YELLOW}Example: $0 clm9f8yxz0000m0g9v01z7ier${NC}"
    
    # Attempt to list farms
    echo -e "\n${CYAN}Available farms:${NC}"
    echo -e "${CYAN}To find your farm ID, look at the URL when viewing a farm in your browser:${NC}"
    echo -e "${CYAN}http://localhost:3000/farms/YOUR_FARM_ID${NC}\n"
    
    exit 1
fi

FARM_ID=$1

# Update the farm ID in the simulator script
echo -e "${GREEN}Setting up simulator with farm ID: ${FARM_ID}${NC}"
sed -i "s/farmId: \"YOUR_FARM_ID\"/farmId: \"$FARM_ID\"/" scripts/simulate_hardware.js

# Install dependencies if needed
if [ ! -d "node_modules/axios" ]; then
    echo -e "${YELLOW}Installing required dependencies...${NC}"
    npm install axios
fi

echo -e "${GREEN}Starting hardware simulator...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the simulation${NC}"
echo -e "${GREEN}===============================================${NC}"

# Run the simulator
node scripts/simulate_hardware.js 
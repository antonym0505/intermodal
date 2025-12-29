import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy FacilityRegistry first
    console.log("\n1. Deploying FacilityRegistry...");
    const FacilityRegistry = await ethers.getContractFactory("FacilityRegistry");
    const facilityRegistry = await FacilityRegistry.deploy();
    await facilityRegistry.waitForDeployment();
    const facilityRegistryAddress = await facilityRegistry.getAddress();
    console.log("FacilityRegistry deployed to:", facilityRegistryAddress);

    // Deploy IntermodalUnit with FacilityRegistry address
    console.log("\n2. Deploying IntermodalUnit...");
    const IntermodalUnit = await ethers.getContractFactory("IntermodalUnit");
    const intermodalUnit = await IntermodalUnit.deploy(facilityRegistryAddress);
    await intermodalUnit.waitForDeployment();
    const intermodalUnitAddress = await intermodalUnit.getAddress();
    console.log("IntermodalUnit deployed to:", intermodalUnitAddress);

    console.log("\n=== Deployment Complete ===");
    console.log("FacilityRegistry:", facilityRegistryAddress);
    console.log("IntermodalUnit:", intermodalUnitAddress);
    console.log("\nTo verify on BaseScan:");
    console.log(`npx hardhat verify --network baseSepolia ${facilityRegistryAddress}`);
    console.log(`npx hardhat verify --network baseSepolia ${intermodalUnitAddress} ${facilityRegistryAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

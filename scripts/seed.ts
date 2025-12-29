import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    // Contract Addresses (Base Sepolia)
    const FACILITY_REGISTRY_ADDRESS = "0x08ae36a05887c1dfdb736394139773b29986f4A5";
    const INTERMODAL_UNIT_ADDRESS = "0xA25bC78cE82d3Af3520F553dC3b1B6E92D28DB14";

    // Attach to contracts
    const FacilityRegistry = await ethers.getContractFactory("FacilityRegistry");
    const registry = FacilityRegistry.attach(FACILITY_REGISTRY_ADDRESS);

    const IntermodalUnit = await ethers.getContractFactory("IntermodalUnit");
    const intermodalUnit = IntermodalUnit.attach(INTERMODAL_UNIT_ADDRESS) as any;

    // 1. Register a Test Facility (if not attempting again)
    // We know USLAX-TST is registered from previous run, so let's verify or skip
    const testFacilityAddress = "0x1234567890123456789012345678901234567890";
    const facilityCode = "USLAX-TST";

    console.log("Checking facility...");
    const isFacility = await registry.isFacility(testFacilityAddress);
    if (!isFacility) {
        console.log(`Registering facility ${facilityCode}...`);
        const tx = await registry.registerFacility(
            testFacilityAddress,
            facilityCode,
            0, // TERMINAL
            "Demo Terminal Los Angeles",
            "Los Angeles, CA"
        );
        await tx.wait();
        console.log("Facility registered!");
    } else {
        console.log("Facility USLAX-TST already registered.");
    }

    // 2. Register a NEW Test Container to ensure fresh state
    // Using a random suffix
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const unitNumber = `MSCU999${randomSuffix}`; // e.g. MSCU9991234
    const ownerCode = "MSC";

    console.log(`Registering NEW container ${unitNumber}...`);
    try {
        const tx = await intermodalUnit.registerContainer(
            deployer.address,
            unitNumber,
            "45G1", // 40ft High Cube
            ownerCode,
            3800,
            32500
        );
        await tx.wait();
        console.log(`Container ${unitNumber} registered successfully!`);

        console.log("\n--------------------------------------------------");
        console.log("DATA SEEDED FOR DEMO:");
        console.log(`Unit Number: ${unitNumber}`);
        console.log(`Receiving Facility: ${testFacilityAddress} (${facilityCode})`);
        console.log("--------------------------------------------------");

        // We will initiate the handoff via CURL in the next step to sync with backend memory

    } catch (e: any) {
        console.log("Error registering container:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { FacilityRegistry, IntermodalUnit } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("IntermodalUnit", function () {
    // Fixture to deploy contracts and set up test data
    async function deployContractsFixture() {
        const [owner, shippingLine, terminal1, terminal2, depot, unauthorized] = await ethers.getSigners();

        // Deploy FacilityRegistry
        const FacilityRegistry = await ethers.getContractFactory("FacilityRegistry");
        const facilityRegistry = await FacilityRegistry.deploy();

        // Deploy IntermodalUnit
        const IntermodalUnit = await ethers.getContractFactory("IntermodalUnit");
        const intermodalUnit = await IntermodalUnit.deploy(await facilityRegistry.getAddress());

        // Register facilities
        await facilityRegistry.registerFacility(
            terminal1.address,
            "USLAX-APM",
            0, // TERMINAL
            "APM Terminals Los Angeles",
            "Los Angeles, CA"
        );

        await facilityRegistry.registerFacility(
            terminal2.address,
            "USLGB-TTI",
            0, // TERMINAL
            "Total Terminals International",
            "Long Beach, CA"
        );

        await facilityRegistry.registerFacility(
            depot.address,
            "USLAX-DEPOT1",
            2, // DEPOT
            "LA Container Depot",
            "Los Angeles, CA"
        );

        return {
            facilityRegistry,
            intermodalUnit,
            owner,
            shippingLine,
            terminal1,
            terminal2,
            depot,
            unauthorized,
        };
    }

    describe("Deployment", function () {
        it("Should set the correct facility registry", async function () {
            const { facilityRegistry, intermodalUnit } = await loadFixture(deployContractsFixture);
            expect(await intermodalUnit.facilityRegistry()).to.equal(await facilityRegistry.getAddress());
        });

        it("Should set the correct owner", async function () {
            const { intermodalUnit, owner } = await loadFixture(deployContractsFixture);
            expect(await intermodalUnit.owner()).to.equal(owner.address);
        });
    });

    describe("Container Registration", function () {
        it("Should register a new container", async function () {
            const { intermodalUnit, shippingLine } = await loadFixture(deployContractsFixture);

            const tx = await intermodalUnit.registerContainer(
                shippingLine.address,
                "MSCU1234567",
                "22G1",
                "MSK",
                2200, // tare weight in kg
                30480 // max gross weight in kg
            );

            await expect(tx)
                .to.emit(intermodalUnit, "ContainerRegistered")
                .withArgs(1, "MSCU1234567", "MSK", shippingLine.address);

            // Verify container data
            const container = await intermodalUnit.getContainer(1);
            expect(container.unitNumber).to.equal("MSCU1234567");
            expect(container.isoType).to.equal("22G1");
            expect(container.ownerCode).to.equal("MSK");
            expect(container.tareWeight).to.equal(2200);
            expect(container.maxGrossWeight).to.equal(30480);
        });

        it("Should prevent duplicate container registration", async function () {
            const { intermodalUnit, shippingLine } = await loadFixture(deployContractsFixture);

            await intermodalUnit.registerContainer(
                shippingLine.address,
                "MSCU1234567",
                "22G1",
                "MSK",
                2200,
                30480
            );

            await expect(
                intermodalUnit.registerContainer(
                    shippingLine.address,
                    "MSCU1234567",
                    "22G1",
                    "MSK",
                    2200,
                    30480
                )
            ).to.be.revertedWithCustomError(intermodalUnit, "ContainerAlreadyExists");
        });

        it("Should only allow owner to register containers", async function () {
            const { intermodalUnit, shippingLine, unauthorized } = await loadFixture(deployContractsFixture);

            await expect(
                intermodalUnit.connect(unauthorized).registerContainer(
                    shippingLine.address,
                    "MSCU1234567",
                    "22G1",
                    "MSK",
                    2200,
                    30480
                )
            ).to.be.revertedWithCustomError(intermodalUnit, "OwnableUnauthorizedAccount");
        });
    });

    describe("Possession Handoff", function () {
        async function setupContainerFixture() {
            const fixture = await loadFixture(deployContractsFixture);
            const { intermodalUnit, shippingLine } = fixture;

            // Register a container
            await intermodalUnit.registerContainer(
                shippingLine.address,
                "MSCU1234567",
                "22G1",
                "MSK",
                2200,
                30480
            );

            return { ...fixture, tokenId: 1 };
        }

        it("Should initiate possession transfer from owner to facility", async function () {
            const { intermodalUnit, shippingLine, terminal1, tokenId } = await loadFixture(setupContainerFixture);

            const duration = 86400; // 24 hours
            const tx = await intermodalUnit.connect(shippingLine).initiatePossessionTransfer(
                tokenId,
                terminal1.address,
                duration
            );

            await expect(tx)
                .to.emit(intermodalUnit, "PossessionTransferInitiated")
                .withArgs(tokenId, shippingLine.address, terminal1.address, await getExpectedExpiry(duration));

            // Check pending handoff
            const handoff = await intermodalUnit.pendingHandoffs(tokenId);
            expect(handoff.from).to.equal(shippingLine.address);
            expect(handoff.to).to.equal(terminal1.address);
            expect(handoff.status).to.equal(1); // PENDING
        });

        it("Should confirm possession by receiving facility", async function () {
            const { intermodalUnit, shippingLine, terminal1, tokenId } = await loadFixture(setupContainerFixture);

            const duration = 86400;
            await intermodalUnit.connect(shippingLine).initiatePossessionTransfer(
                tokenId,
                terminal1.address,
                duration
            );

            const tx = await intermodalUnit.connect(terminal1).confirmPossession(tokenId, "Yard A, Row 5");

            await expect(tx).to.emit(intermodalUnit, "PossessionConfirmed");

            // Verify possession
            const possessor = await intermodalUnit.userOf(tokenId);
            expect(possessor).to.equal(terminal1.address);

            // Verify handoff status
            const handoff = await intermodalUnit.pendingHandoffs(tokenId);
            expect(handoff.status).to.equal(2); // CONFIRMED
        });

        it("Should prevent unauthorized facility from confirming possession", async function () {
            const { intermodalUnit, shippingLine, terminal1, terminal2, tokenId } = await loadFixture(setupContainerFixture);

            await intermodalUnit.connect(shippingLine).initiatePossessionTransfer(
                tokenId,
                terminal1.address,
                86400
            );

            // Terminal2 tries to confirm (should fail)
            await expect(
                intermodalUnit.connect(terminal2).confirmPossession(tokenId, "Yard B")
            ).to.be.revertedWithCustomError(intermodalUnit, "NotAuthorizedFacility");
        });

        it("Should allow chain of possession transfers", async function () {
            const { intermodalUnit, shippingLine, terminal1, depot, tokenId } = await loadFixture(setupContainerFixture);

            // First handoff: ShippingLine -> Terminal1
            await intermodalUnit.connect(shippingLine).initiatePossessionTransfer(
                tokenId,
                terminal1.address,
                86400
            );
            await intermodalUnit.connect(terminal1).confirmPossession(tokenId, "Yard A");

            // Verify terminal1 is possessor
            expect(await intermodalUnit.userOf(tokenId)).to.equal(terminal1.address);

            // Second handoff: Terminal1 -> Depot (possessor initiates)
            await intermodalUnit.connect(terminal1).initiatePossessionTransfer(
                tokenId,
                depot.address,
                86400
            );
            await intermodalUnit.connect(depot).confirmPossession(tokenId, "Storage Bay 12");

            // Verify depot is possessor
            expect(await intermodalUnit.userOf(tokenId)).to.equal(depot.address);

            // Owner remains unchanged
            expect(await intermodalUnit.ownerOf(tokenId)).to.equal(shippingLine.address);
        });

        it("Should prevent transfer to unregistered facility", async function () {
            const { intermodalUnit, shippingLine, unauthorized, tokenId } = await loadFixture(setupContainerFixture);

            await expect(
                intermodalUnit.connect(shippingLine).initiatePossessionTransfer(
                    tokenId,
                    unauthorized.address,
                    86400
                )
            ).to.be.revertedWithCustomError(intermodalUnit, "NotAuthorizedFacility");
        });
    });

    describe("Possession Info", function () {
        it("Should return correct possession info", async function () {
            const { intermodalUnit, shippingLine, terminal1 } = await loadFixture(deployContractsFixture);

            await intermodalUnit.registerContainer(
                shippingLine.address,
                "MSCU1234567",
                "22G1",
                "MSK",
                2200,
                30480
            );

            await intermodalUnit.connect(shippingLine).initiatePossessionTransfer(1, terminal1.address, 86400);
            await intermodalUnit.connect(terminal1).confirmPossession(1, "Yard A");

            const [owner, possessor, expires] = await intermodalUnit.getPossessionInfo(1);

            expect(owner).to.equal(shippingLine.address);
            expect(possessor).to.equal(terminal1.address);
            expect(expires).to.be.gt(0);
        });
    });

    // Helper function to get expected expiry timestamp
    async function getExpectedExpiry(duration: number): Promise<bigint> {
        const block = await ethers.provider.getBlock("latest");
        return BigInt(block!.timestamp + duration);
    }
});

describe("FacilityRegistry", function () {
    async function deployRegistryFixture() {
        const [owner, facility1, facility2, unauthorized] = await ethers.getSigners();

        const FacilityRegistry = await ethers.getContractFactory("FacilityRegistry");
        const facilityRegistry = await FacilityRegistry.deploy();

        return { facilityRegistry, owner, facility1, facility2, unauthorized };
    }

    describe("Facility Registration", function () {
        it("Should register a new facility", async function () {
            const { facilityRegistry, facility1 } = await loadFixture(deployRegistryFixture);

            const tx = await facilityRegistry.registerFacility(
                facility1.address,
                "USLAX-APM",
                0, // TERMINAL
                "APM Terminals Los Angeles",
                "Los Angeles, CA"
            );

            await expect(tx)
                .to.emit(facilityRegistry, "FacilityRegistered")
                .withArgs(facility1.address, "USLAX-APM", 0, "APM Terminals Los Angeles");

            expect(await facilityRegistry.isFacility(facility1.address)).to.be.true;
        });

        it("Should prevent duplicate facility codes", async function () {
            const { facilityRegistry, facility1, facility2 } = await loadFixture(deployRegistryFixture);

            await facilityRegistry.registerFacility(
                facility1.address,
                "USLAX-APM",
                0,
                "APM Terminals",
                "Los Angeles"
            );

            await expect(
                facilityRegistry.registerFacility(
                    facility2.address,
                    "USLAX-APM",
                    0,
                    "Some Other Terminal",
                    "Los Angeles"
                )
            ).to.be.revertedWith("FacilityRegistry: code already exists");
        });

        it("Should deactivate facility", async function () {
            const { facilityRegistry, facility1 } = await loadFixture(deployRegistryFixture);

            await facilityRegistry.registerFacility(
                facility1.address,
                "USLAX-APM",
                0,
                "APM Terminals",
                "Los Angeles"
            );

            expect(await facilityRegistry.isFacility(facility1.address)).to.be.true;

            await facilityRegistry.setFacilityActive(facility1.address, false);

            expect(await facilityRegistry.isFacility(facility1.address)).to.be.false;
            expect(await facilityRegistry.isRegistered(facility1.address)).to.be.true; // Still registered, just inactive
        });
    });
});

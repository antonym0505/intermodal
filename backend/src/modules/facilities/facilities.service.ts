import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlockchainService, FACILITY_REGISTRY_ABI } from '../blockchain/blockchain.service';
import { RegisterFacilityDto, FacilityType } from './dto/register-facility.dto';

export interface FacilityInfo {
    address: string;
    facilityCode: string;
    facilityType: FacilityType;
    name: string;
    location: string;
    isActive: boolean;
    registeredAt: bigint;
}

@Injectable()
export class FacilitiesService {
    private readonly logger = new Logger(FacilitiesService.name);

    constructor(private readonly blockchainService: BlockchainService) { }

    async getFacility(address: string): Promise<FacilityInfo> {
        const facility = await this.blockchainService.readFacilityRegistry(
            'getFacility',
            [address as `0x${string}`],
        );

        if (!facility.facilityCode) {
            throw new NotFoundException(`Facility at ${address} not found`);
        }

        return {
            address,
            facilityCode: facility.facilityCode,
            facilityType: facility.facilityType as FacilityType,
            name: facility.name,
            location: facility.location,
            isActive: facility.isActive,
            registeredAt: facility.registeredAt,
        };
    }

    async isFacility(address: string): Promise<boolean> {
        return this.blockchainService.readFacilityRegistry('isFacility', [
            address as `0x${string}`,
        ]);
    }

    async getAllFacilities(): Promise<FacilityInfo[]> {
        const addresses = await this.blockchainService.readFacilityRegistry(
            'getAllFacilities',
        );

        const facilities: FacilityInfo[] = [];
        for (const address of addresses) {
            try {
                const facility = await this.getFacility(address);
                facilities.push(facility);
            } catch (e: any) {
                this.logger.warn(`Failed to fetch facility ${address}: ${e.message}`);
            }
        }

        return facilities;
    }

    async registerFacility(dto: RegisterFacilityDto): Promise<{ txHash: string }> {
        const walletClient = this.blockchainService.getWalletClient();
        const publicClient = this.blockchainService.getPublicClient();
        const account = this.blockchainService.getAccount();

        if (!walletClient || !account) {
            throw new Error('Wallet not configured');
        }

        this.logger.log(
            `Registering facility: ${dto.facilityCode} at ${dto.facilityAddress}`,
        );

        const { request } = await publicClient.simulateContract({
            address: this.blockchainService.getFacilityRegistryAddress(),
            abi: FACILITY_REGISTRY_ABI,
            functionName: 'registerFacility',
            args: [
                dto.facilityAddress as `0x${string}`,
                dto.facilityCode,
                dto.facilityType,
                dto.name,
                dto.location,
            ],
            account,
        });

        const hash = await walletClient.writeContract(request);

        await publicClient.waitForTransactionReceipt({ hash });

        return { txHash: hash };
    }
}

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createPublicClient,
    createWalletClient,
    http,
    Address,
    type Hex,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract ABIs
export const INTERMODAL_UNIT_ABI = [
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'getContainer',
        outputs: [
            {
                components: [
                    { name: 'unitNumber', type: 'string' },
                    { name: 'isoType', type: 'string' },
                    { name: 'ownerCode', type: 'string' },
                    { name: 'tareWeight', type: 'uint256' },
                    { name: 'maxGrossWeight', type: 'uint256' },
                    { name: 'registeredAt', type: 'uint256' },
                ],
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'unitNumber', type: 'string' }],
        name: 'getTokenIdByUnitNumber',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'getPossessionInfo',
        outputs: [
            { name: 'owner', type: 'address' },
            { name: 'possessor', type: 'address' },
            { name: 'possessionExpires', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getTotalContainers',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'unitNumber', type: 'string' },
            { name: 'isoType', type: 'string' },
            { name: 'ownerCode', type: 'string' },
            { name: 'tareWeight', type: 'uint256' },
            { name: 'maxGrossWeight', type: 'uint256' },
        ],
        name: 'registerContainer',
        outputs: [{ name: 'tokenId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'toFacility', type: 'address' },
            { name: 'duration', type: 'uint64' },
        ],
        name: 'initiatePossessionTransfer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'location', type: 'string' },
        ],
        name: 'confirmPossession',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'pendingHandoffs',
        outputs: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'expires', type: 'uint64' },
            { name: 'initiatedAt', type: 'uint256' },
            { name: 'status', type: 'uint8' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

export const FACILITY_REGISTRY_ABI = [
    {
        inputs: [{ name: 'facilityAddress', type: 'address' }],
        name: 'getFacility',
        outputs: [
            {
                components: [
                    { name: 'facilityCode', type: 'string' },
                    { name: 'facilityType', type: 'uint8' },
                    { name: 'name', type: 'string' },
                    { name: 'location', type: 'string' },
                    { name: 'isActive', type: 'bool' },
                    { name: 'registeredAt', type: 'uint256' },
                ],
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'facilityAddress', type: 'address' }],
        name: 'isFacility',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getAllFacilities',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'facilityAddress', type: 'address' },
            { name: 'facilityCode', type: 'string' },
            { name: 'facilityType', type: 'uint8' },
            { name: 'name', type: 'string' },
            { name: 'location', type: 'string' },
        ],
        name: 'registerFacility',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

@Injectable()
export class BlockchainService implements OnModuleInit {
    private readonly logger = new Logger(BlockchainService.name);
    private publicClient: any;
    private walletClient: any;
    private account: any;
    private intermodalUnitAddress: Address;
    private facilityRegistryAddress: Address;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        const rpcUrl =
            this.configService.get<string>('BASE_SEPOLIA_RPC') ||
            'https://sepolia.base.org';
        const privateKey = this.configService.get<string>('PRIVATE_KEY');

        // Create public client for reading
        this.publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(rpcUrl),
        });

        // Create wallet client for writing (if private key provided)
        if (
            privateKey &&
            privateKey !==
            '0x0000000000000000000000000000000000000000000000000000000000000001'
        ) {
            let formattedKey = privateKey.toString().trim();
            if (!formattedKey.startsWith('0x')) {
                formattedKey = `0x${formattedKey}`;
            }

            try {
                // Cast to correct type
                this.account = privateKeyToAccount(formattedKey as `0x${string}`);

                this.walletClient = createWalletClient({
                    account: this.account,
                    chain: baseSepolia,
                    transport: http(rpcUrl),
                });
                this.logger.log(`Wallet initialized: ${this.account.address}`);
            } catch (error) {
                this.logger.error(`Failed to initialize wallet: ${error.message}`);
                this.logger.warn('Running in read-only mode due to invalid private key');
            }
        } else {
            this.logger.warn(
                'No valid private key provided - write operations will fail',
            );
        }

        // Load contract addresses
        this.intermodalUnitAddress = this.configService.get<string>(
            'INTERMODAL_UNIT_ADDRESS',
        ) as Address;
        this.facilityRegistryAddress = this.configService.get<string>(
            'FACILITY_REGISTRY_ADDRESS',
        ) as Address;

        if (this.intermodalUnitAddress) {
            this.logger.log(`IntermodalUnit contract: ${this.intermodalUnitAddress}`);
        }
        if (this.facilityRegistryAddress) {
            this.logger.log(
                `FacilityRegistry contract: ${this.facilityRegistryAddress}`,
            );
        }
    }

    getPublicClient() {
        return this.publicClient;
    }

    getWalletClient() {
        return this.walletClient;
    }

    getAccount() {
        return this.account;
    }

    getIntermodalUnitAddress(): Address {
        return this.intermodalUnitAddress;
    }

    getFacilityRegistryAddress(): Address {
        return this.facilityRegistryAddress;
    }

    // Read helpers
    async readIntermodalUnit(functionName: string, args: any[] = []): Promise<any> {
        if (!this.intermodalUnitAddress) {
            throw new Error('IntermodalUnit contract address not configured');
        }
        return this.publicClient.readContract({
            address: this.intermodalUnitAddress,
            abi: INTERMODAL_UNIT_ABI,
            functionName,
            args,
        });
    }

    async readFacilityRegistry(functionName: string, args: any[] = []): Promise<any> {
        if (!this.facilityRegistryAddress) {
            throw new Error('FacilityRegistry contract address not configured');
        }
        return this.publicClient.readContract({
            address: this.facilityRegistryAddress,
            abi: FACILITY_REGISTRY_ABI,
            functionName,
            args,
        });
    }

    // Convenience method to check if blockchain is configured
    isConfigured(): boolean {
        return !!(this.intermodalUnitAddress && this.facilityRegistryAddress);
    }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlockchainService, INTERMODAL_UNIT_ABI } from '../blockchain/blockchain.service';
import { RegisterContainerDto } from './dto/register-container.dto';

export interface ContainerInfo {
    tokenId: bigint;
    unitNumber: string;
    isoType: string;
    ownerCode: string;
    tareWeight: bigint;
    maxGrossWeight: bigint;
    registeredAt: bigint;
    owner: string;
    possessor: string | null;
    possessionExpires: bigint;
}

@Injectable()
export class ContainersService {
    private readonly logger = new Logger(ContainersService.name);

    constructor(private readonly blockchainService: BlockchainService) { }

    async getContainerByUnitNumber(unitNumber: string): Promise<ContainerInfo> {
        const tokenId = await this.blockchainService.readIntermodalUnit(
            'getTokenIdByUnitNumber',
            [unitNumber],
        );

        if (tokenId === 0n) {
            throw new NotFoundException(`Container ${unitNumber} not found`);
        }

        return this.getContainerByTokenId(tokenId);
    }

    async getContainerByTokenId(tokenId: bigint): Promise<ContainerInfo> {
        const metadata = await this.blockchainService.readIntermodalUnit(
            'getContainer',
            [tokenId],
        );

        const [owner, possessor, possessionExpires] =
            await this.blockchainService.readIntermodalUnit('getPossessionInfo', [
                tokenId,
            ]);

        return {
            tokenId,
            unitNumber: metadata.unitNumber,
            isoType: metadata.isoType,
            ownerCode: metadata.ownerCode,
            tareWeight: metadata.tareWeight,
            maxGrossWeight: metadata.maxGrossWeight,
            registeredAt: metadata.registeredAt,
            owner,
            possessor:
                possessor === '0x0000000000000000000000000000000000000000'
                    ? null
                    : possessor,
            possessionExpires,
        };
    }

    async registerContainer(
        dto: RegisterContainerDto,
    ): Promise<{ tokenId: bigint; txHash: string }> {
        const walletClient = this.blockchainService.getWalletClient();
        const publicClient = this.blockchainService.getPublicClient();
        const account = this.blockchainService.getAccount();

        if (!walletClient || !account) {
            throw new Error('Wallet not configured - cannot register containers');
        }

        this.logger.log(`Registering container: ${dto.unitNumber}`);

        const { request } = await publicClient.simulateContract({
            address: this.blockchainService.getIntermodalUnitAddress(),
            abi: INTERMODAL_UNIT_ABI,
            functionName: 'registerContainer',
            args: [
                dto.ownerAddress as `0x${string}`,
                dto.unitNumber,
                dto.isoType,
                dto.ownerCode,
                BigInt(dto.tareWeight),
                BigInt(dto.maxGrossWeight),
            ],
            account,
        });

        const hash = await walletClient.writeContract(request);

        this.logger.log(`Container registration tx: ${hash}`);

        await publicClient.waitForTransactionReceipt({ hash });

        const tokenId = await this.blockchainService.readIntermodalUnit(
            'getTokenIdByUnitNumber',
            [dto.unitNumber],
        );

        return { tokenId, txHash: hash };
    }

    async getTotalContainers(): Promise<bigint> {
        return this.blockchainService.readIntermodalUnit('getTotalContainers');
    }
}

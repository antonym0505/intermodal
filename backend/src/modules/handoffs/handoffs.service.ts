import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { BlockchainService, INTERMODAL_UNIT_ABI } from '../blockchain/blockchain.service';
import { ContainersService } from '../containers/containers.service';
import { InitiateHandoffDto } from './dto/initiate-handoff.dto';
import { ConfirmHandoffDto } from './dto/confirm-handoff.dto';

export enum HandoffStatus {
    NONE = 0,
    PENDING = 1,
    CONFIRMED = 2,
}

export interface HandoffInfo {
    tokenId: bigint;
    from: string;
    to: string;
    expires: bigint;
    initiatedAt: bigint;
    status: HandoffStatus;
    bookingReference?: string;
}

// In-memory store for booking references (in production, use a database)
const bookingReferences = new Map<
    string,
    { tokenId: bigint; reference: string }
>();

@Injectable()
export class HandoffsService {
    private readonly logger = new Logger(HandoffsService.name);

    constructor(
        private readonly blockchainService: BlockchainService,
        private readonly containersService: ContainersService,
    ) { }

    async initiateHandoff(dto: InitiateHandoffDto): Promise<{
        txHash: string;
        bookingReference: string;
    }> {
        const walletClient = this.blockchainService.getWalletClient();
        const publicClient = this.blockchainService.getPublicClient();
        const account = this.blockchainService.getAccount();

        if (!walletClient || !account) {
            throw new Error('Wallet not configured');
        }

        const tokenId = await this.blockchainService.readIntermodalUnit(
            'getTokenIdByUnitNumber',
            [dto.unitNumber],
        );
        if (tokenId === 0n) {
            throw new BadRequestException(`Container ${dto.unitNumber} not found`);
        }

        const bookingReference =
            dto.bookingReference || this.generateBookingReference(dto.unitNumber);

        this.logger.log(
            `Initiating handoff: ${dto.unitNumber} -> ${dto.toFacilityAddress} (Booking: ${bookingReference})`,
        );

        const { request } = await publicClient.simulateContract({
            address: this.blockchainService.getIntermodalUnitAddress(),
            abi: INTERMODAL_UNIT_ABI,
            functionName: 'initiatePossessionTransfer',
            args: [
                tokenId,
                dto.toFacilityAddress as `0x${string}`,
                BigInt(dto.durationSeconds),
            ],
            account,
        });

        const hash = await walletClient.writeContract(request);

        bookingReferences.set(`${tokenId}`, {
            tokenId,
            reference: bookingReference,
        });

        await publicClient.waitForTransactionReceipt({ hash });

        return { txHash: hash, bookingReference };
    }

    async confirmHandoff(dto: ConfirmHandoffDto): Promise<{ txHash: string }> {
        const walletClient = this.blockchainService.getWalletClient();
        const publicClient = this.blockchainService.getPublicClient();
        const account = this.blockchainService.getAccount();

        if (!walletClient || !account) {
            throw new Error('Wallet not configured');
        }

        const tokenId = await this.blockchainService.readIntermodalUnit(
            'getTokenIdByUnitNumber',
            [dto.unitNumber],
        );
        if (tokenId === 0n) {
            throw new BadRequestException(`Container ${dto.unitNumber} not found`);
        }

        const storedBooking = bookingReferences.get(`${tokenId}`);
        if (dto.bookingReference && storedBooking) {
            if (storedBooking.reference !== dto.bookingReference) {
                throw new BadRequestException('Invalid booking reference');
            }
        }

        const pendingHandoff = await this.blockchainService.readIntermodalUnit(
            'pendingHandoffs',
            [tokenId],
        );
        const status = pendingHandoff[4];
        if (status !== HandoffStatus.PENDING) {
            throw new BadRequestException('No pending handoff for this container');
        }

        this.logger.log(
            `Confirming handoff: ${dto.unitNumber} at ${dto.location} (Booking: ${dto.bookingReference})`,
        );

        const { request } = await publicClient.simulateContract({
            address: this.blockchainService.getIntermodalUnitAddress(),
            abi: INTERMODAL_UNIT_ABI,
            functionName: 'confirmPossession',
            args: [tokenId, dto.location],
            account,
        });

        const hash = await walletClient.writeContract(request);

        await publicClient.waitForTransactionReceipt({ hash });

        bookingReferences.delete(`${tokenId}`);

        return { txHash: hash };
    }

    async getHandoffStatus(unitNumber: string): Promise<HandoffInfo | null> {
        const tokenId = await this.blockchainService.readIntermodalUnit(
            'getTokenIdByUnitNumber',
            [unitNumber],
        );
        if (tokenId === 0n) {
            throw new BadRequestException(`Container ${unitNumber} not found`);
        }

        const pendingHandoff = await this.blockchainService.readIntermodalUnit(
            'pendingHandoffs',
            [tokenId],
        );
        const [from, to, expires, initiatedAt, status] = pendingHandoff;

        if (status === HandoffStatus.NONE) {
            return null;
        }

        const storedBooking = bookingReferences.get(`${tokenId}`);

        return {
            tokenId,
            from,
            to,
            expires,
            initiatedAt,
            status,
            bookingReference: storedBooking?.reference,
        };
    }

    private generateBookingReference(unitNumber: string): string {
        const prefix = unitNumber.substring(0, 4);
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `BK-${prefix}-${timestamp}-${random}`;
    }
}

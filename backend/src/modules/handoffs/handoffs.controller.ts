import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { HandoffsService } from './handoffs.service';
import { InitiateHandoffDto } from './dto/initiate-handoff.dto';
import { ConfirmHandoffDto } from './dto/confirm-handoff.dto';

@ApiTags('handoffs')
@Controller('handoffs')
export class HandoffsController {
    constructor(private readonly handoffsService: HandoffsService) { }

    @Post('initiate')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Initiate possession transfer',
        description:
            'Owner or current possessor initiates transfer to a registered facility. Returns a booking reference for confirmation.',
    })
    @ApiResponse({
        status: 201,
        description: 'Handoff initiated successfully',
    })
    async initiateHandoff(@Body() dto: InitiateHandoffDto) {
        const result = await this.handoffsService.initiateHandoff(dto);
        return {
            success: true,
            message: 'Possession transfer initiated',
            bookingReference: result.bookingReference,
            transactionHash: result.txHash,
        };
    }

    @Post('confirm')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Confirm possession receipt',
        description:
            'Receiving facility confirms physical receipt of the container. Must provide matching booking reference.',
    })
    @ApiResponse({
        status: 200,
        description: 'Possession confirmed successfully',
    })
    async confirmHandoff(@Body() dto: ConfirmHandoffDto) {
        const result = await this.handoffsService.confirmHandoff(dto);
        return {
            success: true,
            message: 'Possession confirmed',
            transactionHash: result.txHash,
        };
    }

    @Get(':unitNumber/status')
    @ApiOperation({ summary: 'Get pending handoff status for a container' })
    @ApiParam({ name: 'unitNumber', example: 'MSCU1234567' })
    @ApiResponse({
        status: 200,
        description: 'Pending handoff details',
    })
    async getHandoffStatus(@Param('unitNumber') unitNumber: string) {
        const handoff = await this.handoffsService.getHandoffStatus(unitNumber);

        if (!handoff) {
            return {
                hasPendingHandoff: false,
                message: 'No pending handoff for this container',
            };
        }

        return {
            hasPendingHandoff: true,
            tokenId: handoff.tokenId.toString(),
            from: handoff.from,
            to: handoff.to,
            expires: new Date(Number(handoff.expires) * 1000).toISOString(),
            initiatedAt: new Date(Number(handoff.initiatedAt) * 1000).toISOString(),
            status: handoff.status === 1 ? 'PENDING' : 'CONFIRMED',
            bookingReference: handoff.bookingReference,
        };
    }
}

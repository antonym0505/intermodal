import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEthereumAddress, IsNumber, IsOptional, Min, Matches } from 'class-validator';

export class InitiateHandoffDto {
    @ApiProperty({
        example: 'MSCU1234567',
        description: 'ISO 6346 container number',
    })
    @IsString()
    @Matches(/^[A-Z]{4}\d{7}$/, {
        message: 'Unit number must follow ISO 6346 format',
    })
    unitNumber: string;

    @ApiProperty({
        example: '0x1234567890123456789012345678901234567890',
        description: 'Wallet address of the receiving facility',
    })
    @IsEthereumAddress()
    toFacilityAddress: string;

    @ApiProperty({
        example: 86400,
        description: 'Duration of possession in seconds (e.g., 86400 = 24 hours)',
    })
    @IsNumber()
    @Min(3600) // Minimum 1 hour
    durationSeconds: number;

    @ApiPropertyOptional({
        example: 'BK-MSCU-ABC123',
        description: 'Optional booking reference from external system (auto-generated if not provided)',
    })
    @IsOptional()
    @IsString()
    bookingReference?: string;
}

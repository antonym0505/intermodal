import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEthereumAddress, Matches, Min } from 'class-validator';

export class RegisterContainerDto {
    @ApiProperty({
        example: '0x1234567890123456789012345678901234567890',
        description: 'Wallet address of the container owner (shipping line)',
    })
    @IsEthereumAddress()
    ownerAddress: string;

    @ApiProperty({
        example: 'MSCU1234567',
        description: 'ISO 6346 container number',
    })
    @IsString()
    @Matches(/^[A-Z]{4}\d{7}$/, {
        message: 'Unit number must follow ISO 6346 format (e.g., MSCU1234567)',
    })
    unitNumber: string;

    @ApiProperty({
        example: '22G1',
        description: 'ISO 6346 type code',
    })
    @IsString()
    isoType: string;

    @ApiProperty({
        example: 'MSK',
        description: 'Owner prefix code (e.g., MSK for Maersk)',
    })
    @IsString()
    ownerCode: string;

    @ApiProperty({
        example: 2200,
        description: 'Empty weight in kg',
    })
    @IsNumber()
    @Min(0)
    tareWeight: number;

    @ApiProperty({
        example: 30480,
        description: 'Maximum gross weight in kg',
    })
    @IsNumber()
    @Min(0)
    maxGrossWeight: number;
}

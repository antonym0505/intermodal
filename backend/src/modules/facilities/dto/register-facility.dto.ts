import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsEthereumAddress } from 'class-validator';

export enum FacilityType {
    TERMINAL = 0,
    PORT = 1,
    DEPOT = 2,
    VESSEL = 3,
    RAIL = 4,
    TRUCK = 5,
}

export class RegisterFacilityDto {
    @ApiProperty({
        example: '0x1234567890123456789012345678901234567890',
        description: 'Wallet address representing the facility',
    })
    @IsEthereumAddress()
    facilityAddress: string;

    @ApiProperty({
        example: 'USLAX-APM',
        description: 'Unique facility code',
    })
    @IsString()
    facilityCode: string;

    @ApiProperty({
        enum: FacilityType,
        example: FacilityType.TERMINAL,
        description: 'Type of facility',
    })
    @IsEnum(FacilityType)
    facilityType: FacilityType;

    @ApiProperty({
        example: 'APM Terminals Los Angeles',
        description: 'Human-readable facility name',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'Los Angeles, CA',
        description: 'Physical location of the facility',
    })
    @IsString()
    location: string;
}

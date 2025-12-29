import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmHandoffDto {
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
        example: 'BK-MSCU-ABC123',
        description: 'Booking reference provided during handoff initiation',
    })
    @IsString()
    bookingReference: string;

    @ApiProperty({
        example: 'Yard A, Row 5, Slot 12',
        description: 'Physical location where container was received',
    })
    @IsString()
    location: string;
}

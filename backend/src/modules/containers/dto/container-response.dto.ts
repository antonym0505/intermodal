import { ApiProperty } from '@nestjs/swagger';
import { ContainerInfo } from '../containers.service';

export class ContainerResponseDto {
    @ApiProperty({ example: '1' })
    tokenId: string;

    @ApiProperty({ example: 'MSCU1234567' })
    unitNumber: string;

    @ApiProperty({ example: '22G1' })
    isoType: string;

    @ApiProperty({ example: 'MSK' })
    ownerCode: string;

    @ApiProperty({ example: '2200' })
    tareWeight: string;

    @ApiProperty({ example: '30480' })
    maxGrossWeight: string;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    registeredAt: string;

    @ApiProperty({ example: '0x1234...' })
    owner: string;

    @ApiProperty({ example: '0x5678...', nullable: true })
    currentPossessor: string | null;

    @ApiProperty({ example: '2024-01-16T10:30:00Z', nullable: true })
    possessionExpires: string | null;

    static fromContainerInfo(info: ContainerInfo): ContainerResponseDto {
        const dto = new ContainerResponseDto();
        dto.tokenId = info.tokenId.toString();
        dto.unitNumber = info.unitNumber;
        dto.isoType = info.isoType;
        dto.ownerCode = info.ownerCode;
        dto.tareWeight = info.tareWeight.toString();
        dto.maxGrossWeight = info.maxGrossWeight.toString();
        dto.registeredAt = new Date(Number(info.registeredAt) * 1000).toISOString();
        dto.owner = info.owner;
        dto.currentPossessor = info.possessor;
        dto.possessionExpires = info.possessor
            ? new Date(Number(info.possessionExpires) * 1000).toISOString()
            : null;
        return dto;
    }
}

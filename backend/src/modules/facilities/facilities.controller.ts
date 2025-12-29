import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FacilitiesService } from './facilities.service';
import { RegisterFacilityDto, FacilityType } from './dto/register-facility.dto';

@ApiTags('facilities')
@Controller('facilities')
export class FacilitiesController {
    constructor(private readonly facilitiesService: FacilitiesService) { }

    @Get()
    @ApiOperation({ summary: 'List all registered facilities' })
    @ApiResponse({
        status: 200,
        description: 'List of all facilities',
    })
    async getAllFacilities() {
        const facilities = await this.facilitiesService.getAllFacilities();
        return facilities.map((f) => ({
            address: f.address,
            facilityCode: f.facilityCode,
            facilityType: FacilityType[f.facilityType],
            name: f.name,
            location: f.location,
            isActive: f.isActive,
            registeredAt: new Date(Number(f.registeredAt) * 1000).toISOString(),
        }));
    }

    @Get(':address')
    @ApiOperation({ summary: 'Get facility by wallet address' })
    @ApiParam({ name: 'address', example: '0x1234...' })
    @ApiResponse({
        status: 200,
        description: 'Facility details',
    })
    @ApiResponse({ status: 404, description: 'Facility not found' })
    async getFacility(@Param('address') address: string) {
        const facility = await this.facilitiesService.getFacility(address);
        return {
            address: facility.address,
            facilityCode: facility.facilityCode,
            facilityType: FacilityType[facility.facilityType],
            name: facility.name,
            location: facility.location,
            isActive: facility.isActive,
            registeredAt: new Date(Number(facility.registeredAt) * 1000).toISOString(),
        };
    }

    @Get(':address/verify')
    @ApiOperation({ summary: 'Verify if an address is a registered active facility' })
    @ApiParam({ name: 'address', example: '0x1234...' })
    async verifyFacility(@Param('address') address: string) {
        const isValid = await this.facilitiesService.isFacility(address);
        return {
            address,
            isRegisteredFacility: isValid,
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new facility (admin only)' })
    @ApiResponse({
        status: 201,
        description: 'Facility registered successfully',
    })
    async registerFacility(@Body() dto: RegisterFacilityDto) {
        const result = await this.facilitiesService.registerFacility(dto);
        return {
            success: true,
            message: 'Facility registered',
            transactionHash: result.txHash,
        };
    }
}

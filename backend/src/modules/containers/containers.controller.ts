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
import { ContainersService } from './containers.service';
import { RegisterContainerDto } from './dto/register-container.dto';
import { ContainerResponseDto } from './dto/container-response.dto';

@ApiTags('containers')
@Controller('containers')
export class ContainersController {
    constructor(private readonly containersService: ContainersService) { }

    @Get(':unitNumber')
    @ApiOperation({ summary: 'Get container by unit number' })
    @ApiParam({ name: 'unitNumber', example: 'MSCU1234567' })
    @ApiResponse({
        status: 200,
        description: 'Container details with current possession info',
        type: ContainerResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Container not found' })
    async getContainer(@Param('unitNumber') unitNumber: string): Promise<ContainerResponseDto> {
        const container = await this.containersService.getContainerByUnitNumber(unitNumber);
        return ContainerResponseDto.fromContainerInfo(container);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new container' })
    @ApiResponse({
        status: 201,
        description: 'Container registered successfully',
    })
    async registerContainer(@Body() dto: RegisterContainerDto) {
        const result = await this.containersService.registerContainer(dto);
        return {
            success: true,
            tokenId: result.tokenId.toString(),
            transactionHash: result.txHash,
        };
    }

    @Get()
    @ApiOperation({ summary: 'Get container statistics' })
    async getStats() {
        const total = await this.containersService.getTotalContainers();
        return {
            totalContainers: total.toString(),
        };
    }
}

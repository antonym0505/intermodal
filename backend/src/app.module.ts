import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContainersModule } from './modules/containers/containers.module';
import { HandoffsModule } from './modules/handoffs/handoffs.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        BlockchainModule,
        ContainersModule,
        HandoffsModule,
        FacilitiesModule,
    ],
})
export class AppModule { }

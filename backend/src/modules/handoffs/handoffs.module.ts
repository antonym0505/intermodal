import { Module } from '@nestjs/common';
import { HandoffsController } from './handoffs.controller';
import { HandoffsService } from './handoffs.service';
import { ContainersModule } from '../containers/containers.module';

@Module({
    imports: [ContainersModule],
    controllers: [HandoffsController],
    providers: [HandoffsService],
    exports: [HandoffsService],
})
export class HandoffsModule { }

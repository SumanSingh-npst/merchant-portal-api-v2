import { Module } from '@nestjs/common';
import { SharedResourceService } from './shared-resource.service';
import { SharedResourceController } from './shared-resource.controller';

@Module({
  controllers: [SharedResourceController],
  providers: [SharedResourceService],
})
export class SharedResourceModule {}

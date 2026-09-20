import { Module } from '@nestjs/common';
import { AutoOptimizeService } from './auto-optimize.service';

@Module({
  providers: [AutoOptimizeService],
  exports: [AutoOptimizeService],
})
export class AutoOptimizeModule {}

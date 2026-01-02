import { Module } from '@nestjs/common';
import { VariableService } from './variable.service';
import { VariableController } from './variable.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VariableController],
  providers: [VariableService],
  exports: [VariableModule],
})
export class VariableModule {}

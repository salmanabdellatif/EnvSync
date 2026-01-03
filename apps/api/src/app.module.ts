import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from './project/project.module';
import { EnvironmentModule } from './environment/environment.module';
import { UsersModule } from './users/users.module';
import { VariableModule } from './variable/variable.module';
import { MemberModule } from './member/member.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ProjectModule,
    EnvironmentModule,
    UsersModule,
    VariableModule,
    MemberModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [AuthModule],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class VouchersModule {}

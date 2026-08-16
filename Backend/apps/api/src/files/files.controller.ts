import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FilesService, JwtAuthGuard, Roles, RolesGuard } from '@eventer/domain';
import { UploadUrlDto } from './dto/upload-url.dto';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload-url')
  @Roles('ORGANIZER', 'ADMIN')
  uploadUrl(@Body() body: UploadUrlDto) {
    return this.files.createUploadUrl(body);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthRequest } from '../auth/auth.types';
import { AtsService } from './ats.service';

@UseGuards(FirebaseAuthGuard)
@Controller('ats')
export class AtsController {
  constructor(private service: AtsService) {}
  @Post('analyze')
  @UseInterceptors(FileInterceptor('resume'))
  async calculateATS(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
    @Req() req: AuthRequest,
  ) {
    return this.service.analyzeAndStore(
      file,
      jobDescription,
      file.originalname,
      req.user.uid,
    );
  }

  @Get('report/:id')
  async getATSReport(@Param('id') id: string) {
    return this.service.getATSReport(id);
  }
}

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
import { ResumeService } from './resume.service';
import { AnalyzeResumeDto } from './dto/analyze-resume.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthRequest } from '../auth/auth.types';

@UseGuards(FirebaseAuthGuard)
@Controller('resume')
export class ResumeController {
  constructor(private service: ResumeService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('resume'))
  analyze(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: AnalyzeResumeDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.analyzeResume(file, body.jobDescription, req.user.uid);
  }

  @Get('report/:id')
  getAnalysis(@Param('id') id: string) {
    return this.service.getAnalysisById(id);
  }

  @Post('auto-optimize')
  @UseInterceptors(FileInterceptor('resume'))
  autoOptimize(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.service.generateSkillGapBridge(file, jobDescription);
  }

  @Post('skill-gap-bridge')
  @UseInterceptors(FileInterceptor('resume'))
  skillGapBridge(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.service.generateSkillGapBridge(file, jobDescription);
  }

  @Post('interview-readiness')
  @UseInterceptors(FileInterceptor('resume'))
  async interviewReadiness(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.service.generateStarStories(file, jobDescription);
  }

  @Post('star-stories')
  @UseInterceptors(FileInterceptor('resume'))
  async starStories(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.service.generateStarStories(file, jobDescription);
  }
}

import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { YoutubeService } from './youtube.service';
import { TranscribeDto, SendSummaryDto } from './dto/youtube.dto'
import { Response } from 'express';

@ApiTags('youtube')
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) { }

  @Post('transcribe')
  @ApiOperation({ summary: 'Transcribe YouTube video' })
  @ApiResponse({ status: 200, description: 'Processing started' })
  @ApiResponse({ status: 500, description: 'Error starting the process' })
  @ApiBody({ type: TranscribeDto })
  async transcribe(@Body('url') url: string, @Res() res: Response) {
    try {
      const transcript = await this.youtubeService.downloadAndTranscribe(url);
      return res.status(HttpStatus.OK).json({ transcript });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error generating transcript',
        error: error.message,
      });
    }
  }

  private async sendYoutubeSummary(url: string, email: string) {
    const transcript = await this.youtubeService.downloadAndTranscribe(url);
    const summary = await this.youtubeService.generateSummary(transcript);
    await this.youtubeService.sendEmail(email, summary);
    return;
  }

  @Post('summarize')
  @ApiOperation({ summary: 'Generate YouTube video summary and send it via email' })
  @ApiResponse({ status: 200, description: 'Processing started' })
  @ApiResponse({ status: 500, description: 'Error starting the process' })
  @ApiBody({ type: SendSummaryDto })
  async summarize(@Body('url') url: string, @Body('email') email: string, @Res() res: Response) {
    try {
      this.sendYoutubeSummary(url, email);
      return res.status(HttpStatus.OK).json({
        message: "Generate youtube summary request received. The summary will be sent via email shortly."
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error generating summary',
        error: error.message,
      });
    }
  }

  @Post('email')
  async sendEmail(@Body('text') text: string, @Body('email') email: string, @Res() res: Response) {
    try {
      await this.youtubeService.sendEmail(email, text);
      return res.status(HttpStatus.OK).json({
        message: "email is successfully sent"
      })
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error sending email',
        error: error.message,
      });
    }
  }
}
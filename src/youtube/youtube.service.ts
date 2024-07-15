import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ytdl from "@distube/ytdl-core";
import { createWriteStream, createReadStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import * as nodemailer from 'nodemailer';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly openai;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    })
  }

  async downloadAndTranscribe(youtubeUrl: string): Promise<string> {
    const outputDir = join(__dirname, '..', '..', 'tmp');
    const audioPath = join(outputDir, 'audio.mp4');

    console.log(audioPath)
    console.log(youtubeUrl)

    // Ensure the directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir);
    }

    this.logger.log(`Starting download for ${youtubeUrl}`);

    // Download audio from YouTube
    const download = ytdl(youtubeUrl, { filter: 'audioonly' });
    const writeStream = createWriteStream(audioPath);

    // Wrap the download process in a promise
    await new Promise<void>((resolve, reject) => {
      download.pipe(writeStream);
      download.on('end', resolve);
      download.on('error', reject);
      writeStream.on('error', reject);
    });

    this.logger.log(`Download finished for ${youtubeUrl}`);

    // Transcribe audio using Whisper
    const transcription = await this.openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1"
    });

    console.log(transcription.text);

    this.logger.log(`Transcript generated for ${youtubeUrl}`);
    return transcription.text;
  }

  async generateSummary(transcript: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Summarize the following transcript with sections and detailed bullet points in well-structured html: ${transcript}` },
      ],
      temperature: 0.5,
    });

    const summary = response.choices[0].message.content.trim();
    this.logger.log(`Summary generated: ${summary}`);
    return summary;
  }

  async sendEmail(to: string, summary: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get<string>('GMAIL_USER'),
          pass: this.configService.get<string>('GMAIL_PASS'),
        },
      });
      const mailOptions = {
        from: this.configService.get<string>('GMAIL_USER'),
        to,
        subject: 'Your YouTube Video Summary',
        html: summary
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          reject();
        } else {
          this.logger.log(`Email sent: ${info.response}`);
          resolve();
        }
      });
    })

  }
}
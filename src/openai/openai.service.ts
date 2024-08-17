import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import * as fs from "fs";

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>("OPENAI_API_KEY")
    });
  }

  async generateTranscript(filePath: string): Promise<string> {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1"
      });

      return transcription.text;
    } catch (error) {
      this.logger.error(`Error generating transcript: ${error.message}`);
      throw error;
    } finally {
      await this.removeFile(filePath);
    }
  }

  async removeFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
      this.logger.log(`File removed: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error removing file: ${filePath}, ${error.message}`);
    }
  }
}
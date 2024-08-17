import { Controller, Post, UploadedFile, UseInterceptors, MaxFileSizeValidator, ParseFilePipe, FileTypeValidator, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from "@nestjs/swagger";
import { OpenAIService } from "./openai.service";
import { diskStorage } from "multer";
import { extname } from "path";
import { Express } from "express";

@ApiTags("openai")
@Controller("openai")
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) { }

  @Post("transcribe")
  @ApiOperation({
    summary: "Transcribe audio file",
    description: "Upload an audio file (mp3, wav, m4a, ogg, or flac) to transcribe. Maximum file size: 25MB."
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Audio file to transcribe"
        }
      }
    },
    examples: {
      file: {
        summary: "Audio file",
        value: "audio.mp3"
      }
    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          return cb(null, `${randomName}${extname(file.originalname)}`);
        }
      })
    }),
  )
  async transcribeAudio(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB limit
          new FileTypeValidator({ fileType: /(mp3|wav|m4a|ogg|flac)$/ })
        ]
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException("No audio file uploaded");
      }
      const transcript = await this.openaiService.generateTranscript(file.path);
      return { transcript };
    } catch (error) {
      await this.openaiService.removeFile(file.path);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException("Error processing audio file");
    }
  }
}
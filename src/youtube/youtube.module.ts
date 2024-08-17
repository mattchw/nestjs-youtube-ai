import { Module } from "@nestjs/common";
import { YoutubeService } from "./youtube.service";
import { YoutubeController } from "./youtube.controller";
import { OpenAIService } from "../openai/openai.service";
import { AppConfigModule } from "../config/config.module";

@Module({
  imports: [AppConfigModule],
  providers: [YoutubeService, OpenAIService],
  controllers: [YoutubeController]
})
export class YoutubeModule { }

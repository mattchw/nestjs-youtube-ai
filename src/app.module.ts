import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/config.module";
import { YoutubeModule } from "./youtube/youtube.module";
import { OpenAIModule } from "./openai/openai.module";
import { AppController } from "./app.controller";

@Module({
  imports: [AppConfigModule, YoutubeModule, OpenAIModule],
  controllers: [AppController]
})
export class AppModule { }

import { Module } from "@nestjs/common";
import { YoutubeService } from "./youtube.service";
import { YoutubeController } from "./youtube.controller";
import { AppConfigModule } from "../config/config.module";

@Module({
  imports: [AppConfigModule],
  providers: [YoutubeService],
  controllers: [YoutubeController]
})
export class YoutubeModule { }

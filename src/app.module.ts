import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [
    AppConfigModule,
    YoutubeModule,
  ],
})
export class AppModule { }
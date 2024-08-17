import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OpenAIController } from "./openai.controller";
import { OpenAIService } from "./openai.service";

@Module({
  imports: [ConfigModule],
  controllers: [OpenAIController],
  providers: [OpenAIService]
})
export class OpenAIModule { }
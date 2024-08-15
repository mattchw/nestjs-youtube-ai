import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl } from "class-validator";

export class TranscribeDto {
  @ApiProperty({
    description:
      "The URL of the YouTube video to be transcribed and summarized",
    example: "https://www.youtube.com/watch?v=example"
  })
  @IsUrl()
  url: string;
}

export class SubtitleDto extends TranscribeDto {
  @ApiProperty({
    description: "The preferred language of the subtitle",
    example: "en"
  })
  @IsOptional()
  @IsString()
  lang?: string;
}

export class SendSummaryDto extends TranscribeDto {
  @ApiProperty({
    description: "The email address to send the summary to",
    example: "your_email_address@gmail.com"
  })
  email: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class TranscribeDto {
  @ApiProperty({
    description: 'The URL of the YouTube video to be transcribed and summarized',
    example: 'https://www.youtube.com/watch?v=example',
  })
  url: string;
}

export class SendSummaryDto extends TranscribeDto {
  @ApiProperty({
    description: 'The email address to send the summary to',
    example: 'your_email_address@gmail.com',
  })
  email: string;
}
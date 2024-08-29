import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as ytdl from "@distube/ytdl-core";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import * as nodemailer from "nodemailer";
import { OpenAIService } from "../openai/openai.service";

import axios from "axios";
import { find } from "lodash";

import { xmlExtractor } from "../utils/xml";

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly openai: OpenAI;
  private readonly agent: any;

  constructor(
    private configService: ConfigService,
    private openAIService: OpenAIService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>("OPENAI_API_KEY")
    });

    const encodedCookies = this.configService.get<string>("YOUTUBE_COOKIES");
    const cookies = JSON.parse(Buffer.from(encodedCookies, "base64").toString("utf-8"));

    this.agent = ytdl.createAgent(cookies);
  }

  async getSubtitles(videoUrl: string, lang: string[] = ["en", "zh"]) {
    const { data } = await axios.get(videoUrl, { httpsAgent: this.agent });

    if (!data.includes("captionTracks"))
      throw new Error(`Could not find captions for video: ${videoUrl}`);

    const regex = /"captionTracks":(\[.*?\])/;
    const [match] = regex.exec(data);

    const { captionTracks } = JSON.parse(`{${match}}`);

    // Function to find subtitle by language
    const findSubtitleByLang = (lang: string) => {
      return (
        find(captionTracks, {
          vssId: `.${lang}`
        }) ||
        find(captionTracks, {
          vssId: `a.${lang}`
        }) ||
        find(captionTracks, ({ vssId }) => vssId && vssId.match(`.${lang}`))
      );
    };

    // Attempt to find subtitles by given languages
    let subtitle = null;
    for (const language of lang) {
      subtitle = findSubtitleByLang(language);
      if (subtitle && subtitle.baseUrl) break;
    }

    // If no subtitle found for given languages, get the first available subtitle
    if (!subtitle || (subtitle && !subtitle.baseUrl)) {
      subtitle = captionTracks[0];
    }

    if (!subtitle || (subtitle && !subtitle.baseUrl))
      throw new Error(`Could not find any captions for ${videoUrl}`);

    const { data: transcript } = await axios.get(subtitle.baseUrl);

    return xmlExtractor(transcript);
  }

  async downloadAndTranscribe(youtubeUrl: string): Promise<string> {
    const outputDir = join(__dirname, "..", "..", "tmp");
    const audioPath = join(outputDir, "audio.mp4");

    // Ensure the directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir);
    }

    this.logger.log(`Starting download for ${youtubeUrl}`);

    // Download audio from YouTube
    const download = ytdl(youtubeUrl, {
      filter: "audioonly",
      agent: this.agent
    });
    const writeStream = createWriteStream(audioPath);

    // Wrap the download process in a promise
    await new Promise<void>((resolve, reject) => {
      download.pipe(writeStream);
      download.on("end", resolve);
      download.on("error", reject);
      writeStream.on("error", reject);
    });

    this.logger.log(`Download finished for ${youtubeUrl}`);

    // Use OpenAIService to generate transcript
    const transcript = await this.openAIService.generateTranscript(audioPath);

    this.logger.log(`Transcript generated for ${youtubeUrl}`);
    return transcript;
  }

  async generateMarkdownSummary(transcript: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Summarize the following transcript with sections and detailed bullet points in well-structured markdown: ${transcript}`
        }
      ],
      temperature: 0.5
    });

    const summary = response.choices[0].message.content.trim();
    this.logger.log(`Summary generated: ${summary}`);
    return summary;
  }

  async generateHTMLSummary(transcript: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Summarize the following transcript with sections and detailed bullet points in well-structured html: ${transcript}`
        }
      ],
      temperature: 0.5
    });

    const summary = response.choices[0].message.content.trim();
    this.logger.log(`Summary generated: ${summary}`);
    return summary;
  }

  async sendEmail(to: string, summary: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: this.configService.get<string>("GMAIL_USER"),
          pass: this.configService.get<string>("GMAIL_PASS")
        }
      });
      const mailOptions = {
        from: this.configService.get<string>("GMAIL_USER"),
        to,
        subject: "Your YouTube Video Summary",
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
    });
  }
}

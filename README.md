# YouTube AI

This project provides an API for downloading, transcribing, and summarizing YouTube videos using NestJS, OpenAI Whisper, and GPT-4.

## Features

- Download audio from YouTube videos.
- Transcribe the audio using OpenAI Whisper.
- Summarize the transcription using OpenAI GPT-4.
- Send the summary via email.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

2. Install the dependencies:

```bash
npm ci
```

3. Create a `.env` file in the root directory and add the following environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_PASS=your_gmail_password
```

Make sure to replace `your_openai_api_key`, `your_gmail_address@gmail.com`, and `your_gmail_password` with your actual OpenAI API key and Gmail credentials.

## Running the Application

Start the NestJS application:

```bash
npm run start
```

The application will be available at `http://localhost:3000`.

## API Documentation

Swagger documentation is available at `http://localhost:3000/api`.

## Contributing

If you would like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit them.
4. Push your changes to your fork.
5. Create a pull request.

## License

This project is licensed under the MIT License.
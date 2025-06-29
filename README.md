# Slack ChatGPT Assistant Bot

A Slack bot that uses ChatGPT to analyze conversation context and provide intelligent response suggestions. The bot helps teams quickly respond to complex client questions by leveraging conversation history.

## Features

- 🤖 **Smart Context Analysis**: Analyzes up to one month of conversation history
- 💬 **Intelligent Suggestions**: Provides multiple types of response suggestions
- 🔒 **Privacy First**: All suggestions are private and only visible to the requesting user
- ⚙️ **Flexible Configuration**: Multiple analysis methods and user-configurable settings
- 🚀 **Easy Integration**: Simple @mention activation in any Slack channel

## Quick Start

### Prerequisites

- Node.js 18+
- Slack App with appropriate permissions
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd slack-chatgpt-assistant
```

2. Install dependencies:

```bash
npm install
```

3. Copy environment template:

```bash
cp env.example .env
```

4. Configure your environment variables in `.env`:

   - Add your Slack bot token, signing secret, and app token
   - Add your OpenAI API key
   - Configure other settings as needed

5. Build the project:

```bash
npm run build
```

6. Start the bot:

```bash
npm start
```

### Development

For development with auto-reload:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Usage

### Basic Usage

1. Mention the bot in any Slack channel: `@assistant help me respond to this`
2. The bot will analyze the conversation context and provide suggestions
3. Choose from the suggested responses or modify them as needed

### Configuration

Use the `/assistant config` command to configure analysis methods:

- Full month history analysis
- Recent messages focus
- Thread-specific analysis
- Keyword-based filtering

## Architecture

```
src/
├── app.ts                 # Main application entry point
├── config/               # Configuration files
├── handlers/             # Event and command handlers
├── services/             # Business logic services
├── utils/                # Utility functions
├── middleware/           # Middleware components
└── types/                # TypeScript type definitions
```

## Environment Variables

| Variable               | Description                          | Required            |
| ---------------------- | ------------------------------------ | ------------------- |
| `SLACK_BOT_TOKEN`      | Slack bot user OAuth token           | Yes                 |
| `SLACK_SIGNING_SECRET` | Slack app signing secret             | Yes                 |
| `SLACK_APP_TOKEN`      | Slack app-level token                | Yes                 |
| `OPENAI_API_KEY`       | OpenAI API key                       | Yes                 |
| `OPENAI_MODEL`         | ChatGPT model to use                 | No (default: gpt-4) |
| `NODE_ENV`             | Environment (development/production) | No                  |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

ISC License

## Support

For issues and questions, please open an issue on GitHub.

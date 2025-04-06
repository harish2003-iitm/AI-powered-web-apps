# Customer Support Chat Interface

A professional React TypeScript application for customer support ticket submission and processing. This interface connects to a backend API that processes support tickets with AI-driven analysis.

## Features

- Modern React + TypeScript implementation
- Real-time chat interface
- Automatic ticket ID generation
- Ticket submission to API
- Job status polling
- Result visualization with tabs (Summary, Routing, Recommendations, Estimations, Raw Data)

## Project Structure

```
support-chat-interface/
├── public/             # Static files
├── src/                # Source files
│   ├── components/     # React components
│   ├── services/       # API services
│   ├── styles/         # CSS files
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   └── index.tsx       # Entry point
├── package.json        # Project dependencies
└── tsconfig.json       # TypeScript configuration
```

## Setup

1. Make sure you have Node.js (v14+) installed on your machine.

2. Clone the repository:
```
git clone [repository-url]
cd support-chat-interface
```

3. Install dependencies:
```
npm install
```

4. Start the API server (in another terminal):
```
cd [path-to-api]
uvicorn src.api.api:app --host 127.0.0.1 --port 8001
```

5. Start the development server:
```
npm start
```

This will start the application at http://localhost:3000.

## API Endpoints

The application connects to the following API endpoints:

- `GET /healthcheck` - Check API health
- `POST /process_tickets` - Submit a ticket for processing
- `GET /job_status/{job_id}` - Check the status of a processing job

## Development

- The application is built with React 18 and TypeScript.
- State management is done with React hooks.
- CSS is structured using component-specific classes.

## Ticket Processing

When a ticket is submitted, the following process occurs:

1. User inputs are captured in the chat interface
2. A ticket is created with conversation history and metadata
3. The ticket is submitted to the API for processing
4. The application polls for job status until completion
5. Results are displayed in a tabbed interface when processing completes

## Result Types

- **Summary**: Title, key points, and action items from the conversation
- **Routing**: Department assignment and priority
- **Recommendations**: List of suggested actions or solutions
- **Estimations**: Complexity and estimated time to resolve
- **Raw Data**: Complete JSON response from the API 
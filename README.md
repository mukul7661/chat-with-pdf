# PDF RAG System

This project is a PDF RAG (Retrieval Augmented Generation) system that allows users to upload PDF documents and chat with them using AI. The system processes PDFs, extracts their content, and allows users to ask questions that are answered based on the content of the uploaded documents.

## Architecture

<img width="1277" alt="Screenshot 2025-05-23 at 6 10 20 PM" src="https://github.com/user-attachments/assets/d97d5103-c80e-4b0c-ae61-89e7f632313d" />

## Implementation Approach

### PDF Processing Pipeline

1. **Upload and Queue**: When a PDF is uploaded, it's saved to the server and added to a BullMQ queue with Redis as the backing store.
2. **Worker Processing**: A separate worker process handles PDF extraction using LangChain's PDFLoader.
3. **Document Chunking**: Extracted content is split into manageable chunks (1000 characters with 200 character overlap) using CharacterTextSplitter.
4. **Vector Embedding**: Each text chunk is embedded using OpenAI's text-embedding-3-small model.
5. **Vector Storage**: Embeddings are stored in Qdrant vector database with metadata including source filename, page numbers, and chatId for retrieval context.

### RAG System Architecture

1. **User Query Processing**: When a user sends a question, the system:
   - Validates that uploaded files are processed
   - Passes the query to the backend with the relevant chatId
2. **Contextual Retrieval**: The system searches Qdrant for relevant document chunks that match the query using:
   - Semantic similarity via vector embeddings
   - Filtering by chatId to ensure only relevant documents are considered
3. **Response Generation**: Retrieved chunks are passed to the OpenAI GPT-4.1 model as context with a system prompt for accurate summarization.
4. **Streaming Responses**: Responses are streamed back to the client in real-time using Server-Sent Events for better UX.
5. **Source Attribution**: The system includes metadata about source documents, allowing users to view the exact sources for any information.

### Real-time Status Management

The system implements a status tracking mechanism to:

- Show upload progress
- Track document processing status
- Poll for completion status
- Prevent queries on incompletely processed documents

### Frontend Components

1. **File Upload Component**: Handles file drag-and-drop, upload status, and processing feedback.
2. **Chat Interface**: Provides markdown rendering, code highlighting, and source reference viewing.
3. **Responsive Design**: Implemented with TailwindCSS and Framer Motion for smooth animations and transitions.

## Project Structure

The project is organized into two main parts:

### Server

- `server/src/config`: Configuration files, environment variables
- `server/src/models`: Data models and type definitions
- `server/src/services`: Service layer for business logic
- `server/src/controllers`: Controller layer for handling HTTP requests
- `server/src/routes`: API routes for the application
- `server/src/middleware`: Express middleware
- `server/src/worker`: PDF processing worker using BullMQ
- `server/src/utils`: Utility functions

### Client

- `client/src/app`: Next.js app directory with pages and layout
- `client/src/components`: React components
- `client/src/hooks`: Custom React hooks
- `client/src/lib`: Library code and utilities
- `client/src/types`: TypeScript type definitions
- `client/src/utils`: Utility functions
- `client/src/constants`: Application constants
- `client/src/styles`: CSS styles
- `client/src/services`: Service layer for API calls
- `client/src/store`: Global state management

## Technologies Used

- **Backend**: Node.js, Express, BullMQ, LangChain, OpenAI, Qdrant
- **Frontend**: Next.js, React, TailwindCSS, Zustand, Framer Motion
- **Database**: Redis (for queue), Qdrant (vector database)
- **Other**: TypeScript, Server-Sent Events (SSE)

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Redis
- Qdrant

### Environment Variables

Create `.env` files in both server and client directories based on the example files.

#### Server

```
PORT=8000
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=langchainjs-testing
UPLOAD_DIR=uploads/
```

#### Client

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Install Dependencies

```bash
# Server
cd server
pnpm install

# Client
cd client
pnpm install
```

### Run the Application

```bash
# Start Redis and Qdrant (using Docker)
docker-compose up -d

# Start the server
cd server
pnpm run dev

# Start the worker in a separate terminal
cd server
pnpm run dev:worker

# Start the client
cd client
pnpm run dev
```

Visit `http://localhost:3000` to access the application.


## Improvements

- Basic document management (delete, rename)
- Client code refactor
- Responsive design for mobile screen
- Setup the whole project with Docker-compose

## Challenges Faced

I was unfamiliar with concepts like RAG, vector embeddings, and LangChain. To overcome this, I watched tutorials and studied the official documentation to build a solid understanding.

## Features

- Upload PDF documents
- Process and index PDF content
- Chat with AI about document content
- View source references from documents
- Stream AI responses for better UX
- Multiple file upload support
- Dark mode support

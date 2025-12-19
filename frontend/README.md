# Frontend - Wheel Spin Application

React + Vite frontend for the Wheel Spin application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Build

To build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── config/         # Configuration files
│   ├── services/       # API services
│   └── utils/          # Utility functions
├── public/             # Static assets
└── index.html          # HTML entry point
```

## Environment Variables

Create a `.env` file in the frontend directory (optional):
```
VITE_API_BASE_URL=http://localhost:3001/api
```

## Backend Connection

Make sure the backend server is running on `http://localhost:3001` before starting the frontend.


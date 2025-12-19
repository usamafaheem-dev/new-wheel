# Wheel Spin Backend

Backend server for the Wheel Spin application with persistent data storage.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/spins/list/` - Get list of active spin files (for users)
- `GET /api/spins/admin-list/` - Get all spin files (for admin)
- `GET /api/spins/filenames/` - Get filenames only
- `POST /api/spins/upload/` - Upload a new spin file (Excel + optional image)
- `POST /api/spins/spin/:id/` - Spin the wheel and get a random winner
- `DELETE /api/spins/delete/:id/` - Delete a spin file
- `PATCH /api/spins/toggle-active/:id/` - Toggle active status of a spin file
- `POST /api/spins/check-password/` - Check admin password
- `POST /api/spins/set-fixed-winner/:id/` - Set fixed winner for a spin file

## Environment Variables

Create a `.env` file in the backend directory with:
```
MONGODB_URI=your_mongodb_connection_string
PORT=3001
```

## Data Storage

Data is stored in MongoDB:
- `spinfiles` collection - All spin files and their data
- `passwords` collection - Admin password hash

The application uses MongoDB Atlas for cloud storage. Make sure your MongoDB connection string is set in the `.env` file.

## Default Password

Default admin password is: `admin`

## File Upload

The backend accepts:
- Excel files (.xlsx, .xls) - Required
- Image files (for wheel center) - Optional

Uploaded files are temporarily stored in `uploads/` directory and cleaned up after processing.


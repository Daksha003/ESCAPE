# Running ESCAPE on Different Ports

This guide explains how to run the ESCAPE application on custom ports instead of the default ones.

## Default Ports

- **Frontend**: 3000
- **Backend**: 8000

## Quick Start (Using Batch Script)

### Option 1: Default Alternative Ports (3001 & 8001)

```bash
start_app.bat
```

### Option 2: Custom Ports

```bash
start_app.bat 3002 8002
```

This will run:

- Frontend on port **3002**
- Backend on port **8002**

## Manual Setup

### 1. Backend Configuration

The backend now supports the `PORT` environment variable:

```bash
cd backend
set PORT=8001
python server.py
```

Or on Linux/Mac:

```bash
cd backend
PORT=8001 python server.py
```

### 2. Frontend Configuration

The frontend uses the `PORT` environment variable:

```bash
cd frontend
set PORT=3001
npm start
```

Or on Linux/Mac:

```bash
cd frontend
PORT=3001 npm start
```

## Configuration Files

### Backend (.env)

Create a `backend/.env` file:

```env
# Server Port
PORT=8001

# CORS Origins (include your frontend port)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# MongoDB
MONGO_URL=your_mongodb_url
DB_NAME=escape_room_db

# Gemini API
GEMINI_API_KEY=your_api_key
```

### Frontend (package.json)

The proxy is configured to point to the backend:

```json
"proxy": "http://localhost:8000"
```

Update this if your backend runs on a different port.

### Vercel (vercel.json)

For local development with Vercel CLI:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://localhost:8001/api/:path*"
    }
  ]
}
```

## Common Port Combinations

| Frontend | Backend | Use Case            |
| -------- | ------- | ------------------- |
| 3000     | 8000    | Default             |
| 3001     | 8001    | Alternative 1       |
| 3002     | 8002    | Alternative 2       |
| 8080     | 5000    | Common alternatives |

## Troubleshooting

### CORS Errors

If you see CORS errors, update `CORS_ORIGINS` in your `.env` file to include your frontend URL:

```env
CORS_ORIGINS=http://localhost:3001,http://localhost:3002
```

### Port Already in Use

If a port is already in use, try a different one:

```bash
start_app.bat 3005 8005
```

### Backend Not Connecting

Ensure:

1. Backend is running before frontend
2. Proxy in `package.json` matches backend port
3. CORS origins include frontend port

## API Endpoints

Once running, the backend API is available at:

```
http://localhost:PORT/api/
```

Example:

```
http://localhost:8001/api/status
```

## Testing the Setup

1. Start the backend:

   ```bash
   cd backend && set PORT=8001 && python server.py
   ```

2. Start the frontend:

   ```bash
   cd frontend && set PORT=3001 && npm start
   ```

3. Open browser to:

   ```
   http://localhost:3001
   ```

4. Test the API:
   ```
   http://localhost:8001/api/
   ```

Both servers should now be running on your chosen ports!

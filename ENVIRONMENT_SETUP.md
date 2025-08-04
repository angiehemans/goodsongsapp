# Environment Setup Guide

## Local Development Setup

### 1. Environment Variables
Copy the example environment file and configure it for local development:

```bash
cp .env.example .env.local
```

### 2. Configure Local Environment
Edit `.env.local` with your local settings:

```bash
# Backend API URL - where your Rails/backend server is running
NEXT_PUBLIC_API_URL=http://localhost:3000

# Frontend URL - where your Next.js app is running
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 3. Backend Server Requirements
Make sure your backend API server is running on the port specified in `NEXT_PUBLIC_API_URL`:

- **Rails**: Usually runs on port 3000 (`rails server`)
- **Express**: Often runs on port 3000, 8000, or 5000
- **Django**: Usually runs on port 8000 (`python manage.py runserver`)
- **FastAPI**: Usually runs on port 8000 (`uvicorn main:app --reload`)

### 4. Frontend Server
The Next.js frontend is configured to run on port 3001 (see `package.json`):

```bash
npm run dev  # Starts on http://localhost:3001
```

## Production Environment

### Environment Variables
Set these in your production deployment platform (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_API_URL=https://api.goodsongs.app
NEXT_PUBLIC_SITE_URL=https://www.goodsongs.app
```

## Troubleshooting

### Common Issues

1. **Login returns HTML instead of JSON**
   - Check that `NEXT_PUBLIC_API_URL` points to your backend API, not the frontend
   - Make sure your backend server is running and accessible

2. **API calls failing**
   - Verify the backend API URL is correct
   - Check that your backend server is running
   - Ensure CORS is configured properly on your backend

3. **Server components failing**
   - Check that `NEXT_PUBLIC_SITE_URL` is set correctly
   - Ensure the Next.js server can reach its own API routes

### Debug Mode
The login API route includes debug logging. Check your server console for:
- Backend API URL being used
- Response status and headers
- Response content (first 200 characters)

## Environment Separation

- **Local**: `.env.local` → Points to local backend → Uses local database
- **Production**: Environment variables → Points to production backend → Uses production database

This ensures you never accidentally hit production data during development.
# SRMS Production Deployment Guide

## 1. Hosting Options
The System Report Management System is built for flexible deployment:
- **Full-Stack Unified (Docker / Cloud Run / Render / Railway / AWS ECS)**:
  Run the Express + static build using `npm run build && npm run start`.
- **Split Deployment**:
  - **Frontend**: Deploy `dist/` to Vercel, Netlify, or Cloudflare Pages with API proxy to Express backend.
  - **Backend**: Deploy Node.js Express service to Render, Railway, Fly.io, or AWS App Runner.

## 2. Environment Variables Configuration
Set the following environment variables in your production host dashboard:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | HTTP port the server listens on | `3000` or `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/srms?retryWrites=true&w=majority` |
| `SESSION_SECRET` | 32+ character random secret | `prod_secret_32_characters_minimum_random` |
| `APP_NAME` | Display name of system | `System Report Management System` |

## 3. MongoDB Atlas Cluster Provisioning
1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free M0 cluster or production M10+ cluster.
3. In **Database Access**, create a dedicated database user with `readWriteAnyDatabase` or scoped `readWrite` permissions on the `srms` database.
4. In **Network Access**, add the IP address of your application server (or `0.0.0.0/0` with strong authentication credentials).
5. Copy the standard connection string into `MONGODB_URI`.

## 4. Production Build & Start Commands
```bash
# 1. Install production dependencies
npm install

# 2. Build Vite frontend and PWA assets
npm run build

# 3. Start full-stack server
npm run start
```
The server binds to `0.0.0.0:$PORT` and serves API routes on `/api/*` and client SPA on all other routes.

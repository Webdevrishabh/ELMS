# Deploying ELMS to Railway (Automated via Docker)

This guide will help you deploy the ELMS application to Railway using the automated Dockerfiles I created.

## Prerequisites

- Connect your GitHub repository to Railway.

## Step 1: Deploy the Backend

1. In Railway, **New Project** > **Deploy from GitHub repo** > Select ELMS.
2. Go to **Variables**:
    - Add `PORT` = `5000`
    - Add `ALLOWED_ORIGINS` = `*` (Update this later to your frontend URL).
3. Go to **Settings** > **Service**:
    - **Root Directory**: `backend`
    - Railway will automatically detect the `Dockerfile` and build it. You do **not** need to set Build/Start commands.
4. **Networking**: click **Generate Domain**. Copy this URL.

## Step 2: Deploy the Frontend

1. In the same project, **New** > **GitHub Repo** > ELMS.
2. Go to **Variables**:
    - Add `VITE_API_URL` = `https://<your-backend-url>/api` (The URL from Step 1).
        - **Important**: This variable must be present *during the build*. If you add it after, you must **Redeploy**.
3. Go to **Settings** > **Service**:
    - **Root Directory**: `frontend`
    - Railway will detect the `Dockerfile`.
4. **Networking**: click **Generate Domain**.

## Step 3: Final Security Config

1. Copy your **Frontend URL**.
2. Go to Backend **Variables** and update `ALLOWED_ORIGINS` to your Frontend URL.
3. Redeploy Backend.

> **Note**: Both services update automatically whenever you push code to GitHub.

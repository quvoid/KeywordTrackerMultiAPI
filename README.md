# Keyword Position Tracker (Schbang SEO Team)

A robust, multi-API keyword ranking tracker with a modern Neon Green UI.

## 🚀 Deployment Instructions

This project is split into a **Frontend (Vite)** and a **Backend (Express)**.

### 1. Deploy the Backend (Render.com)
*Render is recommended for the Express backend as it supports long-running processes.*

1.  Create an account on [Render.com](https://render.com).
2.  Click **New +** > **Web Service**.
3.  Connect your GitHub repository: `quvoid/KeywordTrackerMultiAPI`.
4.  Set the following configuration:
    *   **Root Directory**: `backend`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
5.  Go to the **Environment** tab and add your `MONGODB_URI` from your `.env` file.
6.  Once deployed, copy the **Render URL** (e.g., `https://your-api.onrender.com`).

### 2. Deploy the Frontend (Vercel)
1.  Go to [Vercel.com](https://vercel.com) and click **Add New** > **Project**.
2.  Import your GitHub repository: `quvoid/KeywordTrackerMultiAPI`.
3.  In the Project Settings:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `frontend`
4.  **Crucial**: Add an Environment Variable:
    *   **Key**: `VITE_API_URL`
    *   **Value**: Your **Render URL** (from Step 1).
5.  Click **Deploy**.

---

## 🛠 Tech Stack
-   **Frontend**: React (Vite), Vanilla CSS (Neon Dark Theme)
-   **Backend**: Node.js, Express, Cheerio
-   **Database**: MongoDB
-   **Scrapers**: ScrapingRobot (Deep Search), Serper, SearchAPI, SerpStack, Zenserp

## 📋 Features
-   **Semantic MjjYud Parsing**: Guaranteed rank indexing matching Google's visual blocks.
-   **Geolocation**: Forced `gl=in` for accurate Indian SEO tracking.
-   **Copy to Sheets**: One-click TSV export for Google Sheets/Excel.
-   **Neon Aesthetic**: Ultra-modern bezel-less dark UI.

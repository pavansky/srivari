# Srivari's Saree Store

A luxury online saree store built with Next.js, featuring WhatsApp ordering integration and an admin dashboard.

## Prerequisites

This project was generated in an environment where **Node.js** was not detected. To run this project, you must have Node.js installed.

1. **Install Node.js**: Download and install from [nodejs.org](https://nodejs.org/). (Version 18+ recommended)
2. **Install Git**: Download from [git-scm.com](https://git-scm.com/).

## Getting Started

Once you have installed Node.js, open your terminal (PowerShell or Command Prompt) in this project folder and run:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the store.

## Deploying to Vercel (Recommended)

To put this store online for free:

1. **Create a GitHub Repository**:
   - Go to [GitHub.com](https://github.com) and create a new repository.
   - push your code:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin <your-repo-url>
     git push -u origin main
     ```

2. **Deploy on Vercel**:
   - Go to [Vercel.com](https://vercel.com) and sign up/login.
   - Click "Add New Project" -> "Import from GitHub".
   - Select your repository.
   - Click "Deploy".
   - Vercel will automatically detect Next.js and build your site.

## Admin Features

- **URL**: `/admin`
- **Demo PIN**: `1234`
- Note: In this demo version, new products added via the Admin panel are local only and will reset on refresh. To make them permanent, a database (like Supabase or MongoDB) integration is needed.

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Styling**: Vanilla CSS (CSS Modules & Global) for custom luxury design
- **Icons**: Lucide React
- **Language**: TypeScript

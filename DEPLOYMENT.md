# Deploying Srivari to Vercel

Since your project uses **Next.js**, **Supabase**, and **Google Auth**, there are a few specific settings you must configure on Vercel for the app to work correctly.

## 1. Push Code to GitHub

Ensure your latest code (including the `prisma` folder and `package.json` updates) is pushed to your GitHub repository.

## 2. Import to Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your `srivari` repository.

## 3. Environment Variables (Critical!)

Before clicking "Deploy", you **MUST** add the following Environment Variables. Vercel cannot read your local `.env.local` file.

Copy these values from your local `.env.local` file:

| Variable Name | Value Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Public API Key |
| `DATABASE_URL` | The Transaction Connection Pooler URL (from Supabase Database Settings) |
| `DIRECT_URL` | The Session Connection Pooler URL (or direct DB URL). *Required if using Prisma.* |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel Domain (e.g., `https://srivari.vercel.app`) - *Add this after the first deployment* |

> [!IMPORTANT]
> For `DATABASE_URL`, ensure you are using the **Connection Pool** URL (port 6543) if possible, or the direct one. Prisma usually needs the `DIRECT_URL` set to the port 5432 version if you are using specific configurations, but standard setup usually works with the main URL.

## 4. Updates Required on Supabase

Once your site is deployed, you will get a URL like `https://srivari-app.vercel.app`.

1. **Update Admin Access**:
    * Go to **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
    * Add your new Vercel URL to **Site URL** or **Redirect URLs**.
    * Example: `https://srivari-app.vercel.app/auth/callback`

2. **Update Google Cloud Console**:
    * Go to **Google Cloud Console** -> **APIs & Services** -> **Credentials**.
    * Edit your OAuth 2.0 Client.
    * Add your Vercel URL to **Authorized JavaScript origins**: `https://srivari-app.vercel.app`
    * Add your Redirect URI to **Authorized redirect URIs**: `https://srivari-app.vercel.app/auth/callback`

## 5. Troubleshooting

* **"Prisma Client not found"**: We added `"postinstall": "prisma generate"` to your `package.json`, so this should be handled automatically.
* **Build Fails on Lint Errors**: If Vercel fails because of "Lint Errors", you can either fix the code or temporarily disable strict linting during build by checking "Ignore Build Command" in Vercel settings (not recommended for final prod).

## 6. Verify Deployment

Once deployed, visit your Vercel URL.

* **Check Products**: Go to `/shop`. It should load products from your Supabase DB.
* **Check Admin**: Login with `support@thesrivari.com`. It should take you to the dashboard.

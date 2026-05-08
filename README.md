# ApplyJi — AI-Powered Job Application Tracker

ApplyJi is a comprehensive solution for job seekers, combining powerful tracking tools with Gemini AI insights to streamline your job search.

## What it does

- **Application Tracking**: Manage your job applications in a visual Kanban board or list view.
- **Gmail Sync**: Automatically parse job-related emails to create and update applications.
- **AI Resume Analysis**: Get ATS scores and specific feedback on how to improve your resume for a target job.
- **Cover Letter Generation**: Create personalized cover letters tailored to specific job descriptions.
- **Skills Gap Analysis**: Compare your skills against job descriptions to see what you're missing.
- **Job Discovery**: Find and save jobs that match your profile.
- **One-Click Apply**: Generate tailored application content with a single click.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui, React Router v7
- **Backend**: Express.js, TypeScript, `tsx` (for running TS files)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (Gemini 3)
- **Payments**: Stripe (Sole Payment Gateway - Razorpay was removed)
- **Auth**: Supabase Auth + Google OAuth

## Local Setup

Follow these steps to get the project running locally:

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/hardiksh28/ApplyJi.git
    cd applyji
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in all values:
    ```bash
    cp .env.example .env
    ```
    *(See the Environment Variables section below for details on each value)*

4.  **Set up Supabase**:
    - Create a project on [Supabase](https://supabase.com/).
    - Run the database migrations located in the `/supabase/migrations/` folder or apply the `schema.sql` file in the SQL editor.

5.  **Set up Google Cloud for Gmail OAuth**:
    - Create a project in Google Cloud Console.
    - Enable Gmail API.
    - Create OAuth 2.0 Client IDs and set the redirect URI to your local or hosted callback endpoint (e.g., `http://localhost:3000/api/auth/google/callback`).

6.  **Run the app**:
    ```bash
    npm run dev
    ```

## Environment Variables

Here is an explanation of the variables required in your `.env` file:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API key for AI features. |
| `APP_URL` | The base URL of the application (e.g., `http://localhost:3000`). |
| `VITE_SUPABASE_URL` | Your Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY`| Your Supabase anonymous key (public). |
| `SUPABASE_SERVICE_ROLE_KEY`| Your Supabase service role key (secret, for server use only). |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret. |
| `GOOGLE_REDIRECT_URI` | Google OAuth Redirect URI for Gmail sync. |
| `STRIPE_SECRET_KEY` | Stripe Secret Key for payments. |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret for processing events. |
| `VITE_STRIPE_PUBLISHABLE_KEY`| Stripe Publishable Key for frontend. |

## Project Structure

```text
applyji/
├── src/                # Frontend and Backend source code
│   ├── components/     # UI Components (React)
│   ├── lib/            # Utility functions and API clients (Supabase, Gemini)
│   ├── middleware/     # Express middleware (Auth, Subscription check)
│   ├── pages/          # React page components (Dashboard, Billing, etc.)
│   ├── routes/         # Express API routes
│   └── types/          # TypeScript type definitions
├── supabase/           # Supabase migrations and schema
│   └── migrations/     # SQL migration files
├── server.ts           # Main Express server entry point
├── package.json        # Project dependencies and scripts
└── vitest.config.ts    # Vitest configuration
```

## Feature Flags / Plans

| Feature | Free | Pro | Enterprise |
| :--- | :---: | :---: | :---: |
| Applications Limit | 5/mo | Unlimited | Unlimited |
| Manual Job Logging | Yes | Yes | Yes |
| Gmail Sync | No | Yes | Yes |
| AI Resume Analysis | No | Yes | Yes |
| AI Cover Letter | No | Yes | Yes |
| Priority Support | No | No | Yes |

## Contributing

We welcome contributions! Please follow these steps:
1.  Open an issue to discuss the changes you want to make.
2.  Fork the repository and create a new branch.
3.  Submit a Pull Request with a clear description of your changes.

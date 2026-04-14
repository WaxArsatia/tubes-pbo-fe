# tubes-pbo-fe

Frontend for a PDF summarization and quiz platform, built with Next.js App Router. The app supports user authentication, PDF upload and summarization, quiz generation/taking, history management, and admin pages for monitoring and user management.

## Features

- Authentication flows: register, login, email verification, forgot/reset password.
- Protected user area with dashboard, summaries, quizzes, history, and account settings.
- PDF upload (up to 10MB in client validation), AI summary display, download, and deletion.
- Quiz generation from summaries with difficulty and question count options.
- Quiz attempt flow (take quiz, submit answers, view results with explanations).
- Admin area with dashboard stats/charts, activity log, and user management (list/detail/create/edit/delete).

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript.
- Tailwind CSS v4 and shadcn/ui components.
- Axios for API calls.
- Recharts for admin dashboard charts.
- Sonner for toast notifications.

## Setup and Run

1. Install dependencies:

```bash
npm install
# or
bun install
```

2. Create local environment file:

```bash
cp .env.example .env.local
```

3. Set API base URL in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

4. Start development server:

```bash
npm run dev
# or
bun run dev
```

5. Open http://localhost:3000

### Other scripts

```bash
npm run build
npm run start
npm run lint
```

## Project Structure

```text
app/
	(authenticated)/     # protected user pages
	(admin)/             # admin-only pages
	login register verify forgot-password reset-password
components/
	ui/                  # shared UI primitives (shadcn-based)
	admin/               # admin-specific components/modals
contexts/              # auth context provider
hooks/                 # auth/session hooks
lib/                   # api client, auth helpers, validators, types, utils
public/                # static assets
```

## Contributing

No `CONTRIBUTING` guide is currently included in this repository.

## License

No `LICENSE` file is currently included in this repository.

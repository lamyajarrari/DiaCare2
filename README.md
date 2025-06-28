# DiaCare - Dialysis Machine Management System

A comprehensive web application for managing dialysis machines, monitoring alerts, and coordinating maintenance activities in healthcare facilities.

## Features

- **User Management**: Multi-role system (Admin, Technician, Patient)
- **Machine Management**: Track dialysis machines, maintenance schedules, and status
- **Alert System**: Real-time email notifications for machine issues
- **Maintenance Control System**: Automated notifications for maintenance intervals (3 months, 6 months, 1 year)
- **Intervention Tracking**: Manage maintenance and repair interventions
- **Fault Reporting**: Document and track machine faults
- **Dashboard**: Role-specific dashboards with relevant information

## Alert System

The application uses **email notifications** instead of SMS for alert delivery:

- **Automatic Email Alerts**: When a new alert is created, emails are automatically sent to all technicians
- **Rich Email Content**: Emails include detailed information about the alert including:
  - Alert message and type
  - Priority level with color coding
  - Machine details (ID, name, department)
  - Required actions
  - Timestamp
- **Professional Design**: HTML emails with responsive design and clear formatting
- **Error Handling**: Email failures don't block alert creation

## Maintenance Control System

The system automatically tracks and notifies technicians about required maintenance controls:

### Maintenance Intervals

- **3 Months**: Routine maintenance checks
- **6 Months**: Extended maintenance with calibration
- **1 Year**: Annual comprehensive maintenance

### Features

- **Automatic Date Calculation**: Next control dates are automatically calculated based on control type
- **Email Notifications**: Technicians receive emails for:
  - Upcoming controls (within 7 days)
  - Overdue controls (past due date)
- **Status Tracking**: Track control status (completed, pending, overdue)
- **Notes System**: Add detailed notes for each control
- **Technician Assignment**: Assign specific technicians to machines

### Notification Types

- **Upcoming Controls**: Orange notifications for controls due within 7 days
- **Overdue Controls**: Red urgent notifications for past due controls
- **Professional Email Design**: Rich HTML emails with machine details and action items

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Gmail account (for email notifications)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables in `.env`:

   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-change-in-production"

   # Email Configuration (for alert notifications)
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-app-password"
   ```

4. Set up the database:

   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

### Email Configuration

For Gmail email notifications:

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account settings → Security
   - Under "2-Step Verification", click "App passwords"
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASSWORD` in your `.env` file

### Testing Email Configuration

Visit `/test-email` to test your email configuration before using the alert system.

### Testing Maintenance Notifications

Run the maintenance notification test:

```bash
pnpm test:maintenance
```

## Default Users

After seeding the database, you can log in with:

- **Patient**: `patient@diacare.com` / `password123`
- **Technician**: `tech@diacare.com` / `password123`
- **Admin**: `admin@diacare.com` / `password123`

## API Endpoints

- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create new alert (triggers email notification)
- `POST /api/test-email` - Test email configuration
- `GET /api/maintenance-controls` - Get all maintenance controls
- `POST /api/maintenance-controls` - Create new maintenance control
- `GET /api/maintenance-notifications` - Check upcoming/overdue controls
- `POST /api/maintenance-notifications` - Send maintenance notifications
- `GET /api/cron/maintenance-notifications` - Cron job endpoint for automated notifications
- `GET /api/users` - Get all users
- `GET /api/machines` - Get all machines

## Automation

### Cron Job Setup

To automate maintenance notifications, set up a cron job to call the notification endpoint:

```bash
# Run daily at 9:00 AM
0 9 * * * curl -X GET "http://your-domain.com/api/cron/maintenance-notifications"
```

Or use a service like:

- **Vercel Cron Jobs** (if deployed on Vercel)
- **GitHub Actions** (for GitHub-hosted projects)
- **External cron services** (cron-job.org, easycron.com)

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Prisma ORM with SQLite
- **Email**: Nodemailer with Gmail SMTP
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, shadcn/ui

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Minecraft Auth - Web Application

A modern Next.js 14 web application for Minecraft server authentication with TailwindCSS and shadcn/ui.

## Features

- **Registration System**: Unique token-based registration
- **Modern UI**: Beautiful, responsive design with TailwindCSS
- **Type Safety**: Built with TypeScript
- **Database Integration**: Prisma ORM with MySQL
- **Security**: Bcrypt password hashing, token expiration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Prisma + MySQL
- **Authentication**: Bcrypt

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="mysql://root:password@localhost:3306/minecraft_auth"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

The database schema is managed by the SQL file in `../database/schema.sql`. Make sure your MySQL database is set up before starting the application.

```bash
# Run the schema script
mysql -u root -p minecraft_auth < ../database/schema.sql
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Production Build

```bash
npm run build
npm start
```

## Project Structure

```
website/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── register/      # Registration endpoint
│   │   │   ├── login/         # Login endpoint
│   │   │   └── validate-token/ # Token validation
│   │   ├── register/          # Registration page
│   │   ├── login/             # Login page
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home page
│   │   └── globals.css
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       └── utils.ts           # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## API Routes

### POST /api/register

Register a new user account.

**Request Body:**
```json
{
  "token": "abc123...",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "minecraftUsername": "Steve",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

### POST /api/login

Authenticate user credentials (for web dashboard).

**Request Body:**
```json
{
  "minecraftUsername": "Steve",
  "password": "password123"
}
```

### GET /api/validate-token?token=xyz

Validate a registration token.

**Response:**
```json
{
  "valid": true,
  "minecraftUsername": "Steve"
}
```

## Pages

- **/** - Home page with instructions
- **/register?token=xyz** - Registration form
- **/login** - Web dashboard login

## Security Features

- ✅ Bcrypt password hashing (cost factor 12)
- ✅ Token expiration validation
- ✅ Email uniqueness validation
- ✅ Username uniqueness validation
- ✅ Input sanitization
- ✅ SQL injection prevention (Prisma)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Troubleshooting

**Prisma Client errors:**
```bash
npx prisma generate
```

**Database connection issues:**
- Verify DATABASE_URL in `.env`
- Ensure MySQL is running
- Check database credentials

**Port already in use:**
```bash
# Use a different port
PORT=3001 npm run dev
```

## Support

For full system documentation, see the main README.md in the project root.

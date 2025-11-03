# Environment Setup Guide

## Required Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

### NextAuth Configuration
```bash
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_DEBUG=true
```

### API Configuration
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Google OAuth (Optional)
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Testing (for Cypress)
```bash
ADMIN_PASSWORD=your-admin-password-here
```

## Setup Steps

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Generate a secure NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```

3. Update the values in `.env.local`

4. Restart the development server:
   ```bash
   npm run dev
   ```

## Notes

- `NEXTAUTH_SECRET` should be a secure random string
- `NEXTAUTH_URL` should match your development server URL
- Keep `.env.local` out of version control

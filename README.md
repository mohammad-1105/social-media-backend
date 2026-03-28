# Modular Auth API

`modular-auth-api` is a modular authentication backend built with Node.js, Express, TypeScript, and MongoDB. It focuses on production-style auth flows such as registration, email verification, login, refresh tokens, password recovery, role-based authorization, and consistent API responses.

## What this app does

- Registers users with `username`, `email`, and `password`
- Requires email verification before login
- Logs users in with either email or username
- Issues JWT access and refresh tokens
- Stores auth tokens in HTTP-only cookies and also returns them in JSON responses
- Supports password reset and in-session password change
- Exposes a current-user endpoint for authenticated clients
- Restricts role assignment to admins
- Includes validation, rate limiting, logging, error handling, and health checks

## Tech stack

- Node.js 20+
- Express 5
- TypeScript
- MongoDB with Mongoose
- JWT with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Input validation with Zod
- Email delivery with Nodemailer and Mailgen
- Logging with Winston and Morgan

## Architecture

The codebase follows a modular, layered structure:

- `controller`: handles HTTP input/output
- `service`: contains business rules and auth workflows
- `repository`: contains database access
- `shared`: reusable constants, middleware, logging, and utilities
- `config`: app-level infrastructure setup

## Project structure

```text
src/
  app.ts
  index.ts
  config/
    db.ts
    env.ts
    middleware.config.ts
    rate-limit.config.ts
    routes.config.ts
    security.config.ts
  modules/
    auth/
      dto/
        auth.dto.ts
      user.controller.ts
      user.mailer.ts
      user.model.ts
      user.repository.ts
      user.routes.ts
      user.service.ts
  shared/
    constants/
      db.constants.ts
      user.constants.ts
    context/
      request-context.ts
    logger/
      morgan.middleware.ts
      winston.logger.ts
    middlewares/
      auth.middleware.ts
      error.middleware.ts
      request-context.middleware.ts
      validate.middleware.ts
    utils/
      api-error.ts
      api-response.ts
      generate-tokens.ts
      mail.ts
```

## Core files

- `src/index.ts`: starts the HTTP server and handles graceful shutdown
- `src/app.ts`: creates the Express app, health checks, routes, and error handling
- `src/config/env.ts`: validates environment variables at startup
- `src/modules/auth/user.routes.ts`: auth endpoint definitions
- `src/modules/auth/user.controller.ts`: request/response layer for auth
- `src/modules/auth/user.service.ts`: login, verification, refresh, password, and role logic
- `src/modules/auth/user.repository.ts`: Mongoose queries
- `src/modules/auth/user.model.ts`: user schema and password hashing

## User model summary

Each user stores:

- `username`
- `email`
- `password`
- `role` (`USER` or `ADMIN`)
- `loginType` (`EMAIL_PASSWORD`, with enum space reserved for social logins)
- `isEmailVerified`
- `refreshToken`
- email verification token and expiry
- forgot-password token and expiry
- avatar metadata

## Validation rules

- `username`: 3-30 chars, lowercase letters, numbers, and underscores only
- `email`: must be a valid email
- `password`: 8-64 chars and must include uppercase, lowercase, and number
- `change-password`: new password must be different from old password
- `assign-role`: role must be `USER` or `ADMIN`

## Authentication behavior

- Login returns `accessToken` and `refreshToken` in the response body
- Login also sets `accessToken` and `refreshToken` as HTTP-only cookies
- Protected routes accept either:
  - `Authorization: Bearer <accessToken>`
  - `accessToken` cookie
- Refresh token endpoint accepts either:
  - `refreshToken` cookie
  - `refreshToken` in request body
- Cookies use `httpOnly: true`
- Cookies are `secure` only in production
- Cookies use `sameSite: "lax"`
- Users must verify their email before they can log in

## Response format

Successful responses follow this shape:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged in successfully",
  "data": {}
}
```

Error responses follow this shape:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": {}
}
```

## Environment variables

Create a `.env` file in the project root.

| Variable                       | Required | Description                                           |
| ------------------------------ | -------- | ----------------------------------------------------- |
| `NODE_ENV`                     | Yes      | `development`, `test`, or `production`                |
| `PORT`                         | Yes      | Port for the API server                               |
| `DATABASE_URL`                 | Yes      | MongoDB connection string                             |
| `CORS_ORIGIN`                  | Yes      | Allowed frontend origin(s), or `*`                    |
| `ACCESS_TOKEN_SECRET`          | Yes      | Secret used to sign access tokens                     |
| `ACCESS_TOKEN_EXPIRY`          | Yes      | Access token lifetime, for example `15m`              |
| `REFRESH_TOKEN_SECRET`         | Yes      | Secret used to sign refresh tokens                    |
| `REFRESH_TOKEN_EXPIRY`         | Yes      | Refresh token lifetime, for example `7d`              |
| `SMTP_HOST`                    | Yes      | SMTP provider host                                    |
| `SMTP_PORT`                    | Yes      | SMTP provider port                                    |
| `SMTP_USER`                    | Yes      | SMTP username or sender address                       |
| `SMTP_PASS`                    | Yes      | SMTP password or app password                         |
| `FORGOT_PASSWORD_REDIRECT_URL` | No       | Frontend reset-password URL base used in reset emails |

Example:

```env
NODE_ENV="development"
PORT="3000"
DATABASE_URL="mongodb://127.0.0.1:27017/modular-auth-api"
CORS_ORIGIN="http://localhost:5173"
ACCESS_TOKEN_SECRET="replace-this"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_SECRET="replace-this-too"
REFRESH_TOKEN_EXPIRY="7d"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="your-user"
SMTP_PASS="your-pass"
FORGOT_PASSWORD_REDIRECT_URL="http://localhost:5173/reset-password"
```

## Installation

```bash
git clone <your-repository-url> modular-auth-api
cd modular-auth-api
pnpm install
cp .env.example .env
```

Update `.env` with real values before starting the server.

## Available scripts

```bash
pnpm run dev
pnpm run build
pnpm run start
pnpm run lint
pnpm run fmt
pnpm run check
```

## Running locally

Start MongoDB, then run:

```bash
pnpm run dev
```

The API will be available at:

```text
http://localhost:3000
```

## Health endpoints

| Method | Path             | Auth   | Description                            |
| ------ | ---------------- | ------ | -------------------------------------- |
| `GET`  | `/api/health`    | Public | Health check                           |
| `GET`  | `/api/v1/health` | Public | Same health check under versioned path |

## Auth API base path

All auth endpoints are mounted under:

```text
/api/v1/users
```

## Endpoint summary

| Method  | Path                               | Auth      | Description                                   |
| ------- | ---------------------------------- | --------- | --------------------------------------------- |
| `POST`  | `/register`                        | Public    | Create a new user and send verification email |
| `POST`  | `/login`                           | Public    | Login with email or username                  |
| `POST`  | `/refresh-token`                   | Public    | Issue a fresh access token and refresh token  |
| `GET`   | `/verify-email/:verificationToken` | Public    | Verify a user's email                         |
| `POST`  | `/forgot-password`                 | Public    | Send password reset email                     |
| `POST`  | `/reset-password/:resetToken`      | Public    | Set a new password using reset token          |
| `POST`  | `/logout`                          | Protected | Clear stored refresh token and auth cookies   |
| `GET`   | `/current-user`                    | Protected | Get the authenticated user                    |
| `POST`  | `/change-password`                 | Protected | Change the current user's password            |
| `POST`  | `/resend-email-verification`       | Protected | Resend verification email                     |
| `PATCH` | `/assign-role/:userId`             | Admin     | Change a user's role                          |

## Endpoint documentation

### `POST /api/v1/users/register`

Creates a new account with role `USER` and sends an email verification message.

Request body:

```json
{
  "username": "aman_dev",
  "email": "aman@example.com",
  "password": "StrongPass123"
}
```

Notes:

- Username and email must be unique
- Email verification is required before login
- Password is hashed before storage

### `GET /api/v1/users/verify-email/:verificationToken`

Marks the user's email as verified if the token is valid and not expired.

Path params:

```text
verificationToken: string
```

### `POST /api/v1/users/resend-email-verification`

Requires authentication. Sends a new email verification link to the current user.

Request body:

```json
{}
```

### `POST /api/v1/users/login`

Logs a verified user in. Accepts either email or username plus password.

Request body with email:

```json
{
  "email": "aman@example.com",
  "password": "StrongPass123"
}
```

Request body with username:

```json
{
  "username": "aman_dev",
  "password": "StrongPass123"
}
```

Response data includes:

- `user`
- `accessToken`
- `refreshToken`

### `POST /api/v1/users/refresh-token`

Issues a new access token and refresh token.

You can send the refresh token either as a cookie or in the request body:

```json
{
  "refreshToken": "your-refresh-token"
}
```

### `POST /api/v1/users/logout`

Requires authentication. Clears the stored refresh token and removes auth cookies.

Request body:

```json
{}
```

### `GET /api/v1/users/current-user`

Requires authentication. Returns the currently authenticated user.

Auth options:

```text
Authorization: Bearer <accessToken>
```

or valid `accessToken` cookie.

### `POST /api/v1/users/forgot-password`

Starts the password reset flow.

Request body:

```json
{
  "email": "aman@example.com"
}
```

Notes:

- Sends an email with a reset URL if `FORGOT_PASSWORD_REDIRECT_URL` is configured
- Otherwise the email contains the raw reset token for manual use

### `POST /api/v1/users/reset-password/:resetToken`

Sets a new password using a valid reset token.

Path params:

```text
resetToken: string
```

Request body:

```json
{
  "newPassword": "NewStrongPass123"
}
```

### `POST /api/v1/users/change-password`

Requires authentication. Changes the current user's password after verifying the old password.

Request body:

```json
{
  "oldPassword": "StrongPass123",
  "newPassword": "NewStrongPass123"
}
```

### `PATCH /api/v1/users/assign-role/:userId`

Requires authentication and `ADMIN` role.

Path params:

```text
userId: MongoDB ObjectId
```

Request body:

```json
{
  "role": "ADMIN"
}
```

Allowed values:

- `ADMIN`
- `USER`

## Example usage flow

### 1. Register

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "aman_dev",
    "email": "aman@example.com",
    "password": "StrongPass123"
  }'
```

### 2. Verify email

Use the verification link sent by email:

```text
GET /api/v1/users/verify-email/<token>
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aman@example.com",
    "password": "StrongPass123"
  }'
```

### 4. Access a protected route

```bash
curl http://localhost:3000/api/v1/users/current-user \
  -H "Authorization: Bearer <accessToken>"
```

### 5. Refresh the session

```bash
curl -X POST http://localhost:3000/api/v1/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

### 6. Request password reset

```bash
curl -X POST http://localhost:3000/api/v1/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aman@example.com"
  }'
```

### 7. Reset password

```bash
curl -X POST http://localhost:3000/api/v1/users/reset-password/<resetToken> \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewStrongPass123"
  }'
```

## Notes for frontend integration

- Send credentials with cookies enabled if you want browser-based cookie auth
- You can also store the returned access token client-side and send it as a Bearer token
- Handle `401` for expired or missing tokens
- Handle `403` for permission failures and unverified-email login attempts
- Use the refresh endpoint when the access token expires

## Current scope

This project currently implements core email/password authentication flows. Social login and avatar upload are not wired into the active routes yet.

## License

ISC

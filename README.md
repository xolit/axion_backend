# Movies Backend

Simple production-ready backend for a movies app using Express, MongoDB, Mongoose, and Redis caching.

Quick start:

1. Install deps

```bash
npm install
```

2. Copy `.env.example` to `.env` and set `MONGO_URI` and `REDIS_URL`.

3. Seed sample data:

```bash
npm run seed
```

4. Start dev server:

```bash
npm run dev
```

APIs:

- `GET /movie/:movieName` — returns movies matching the title (case-insensitive substring).
- `GET /home?page=1` — returns 10 movies per page and `nextPage` if available.

## Auth Flow for Frontend

1. Request OTP
   - Endpoint: `POST /auth/account`
   - Body for new signup: `{ "email": "user@example.com", "username": "john_doe" }`
   - Body for existing login: `{ "email": "user@example.com" }`
   - Behavior: creates a user if it does not exist, stores the email and optional username, generates a 6-digit OTP, and sends it to the email.
   - Response: `{ success: true, message: "OTP sent successfully. Check your email." }`
   - Note: do not expect `userId` in this response.

2. Verify OTP
   - Endpoint: `POST /auth/account`
   - Body: `{ "email": "user@example.com", "otp": "123456" }`
   - Behavior: verifies the OTP, clears any existing OTPs, and returns the userId.
   - Response: `{ success: true, message: "OTP verified successfully.", userId }`

3. Delete user
   - Endpoint: `DELETE /auth/user`
   - Body: `{ "userId": "<USER_ID>", "accessToken": "<ACCESS_TOKEN>" }`
   - Behavior: deletes the user record and removes any pending OTPs for that email.
   - Response: `{ success: true, message: "User deleted successfully." }`

4. Use `userId` for protected API requests
   - Include both `accessToken` and `userId` on all non-admin routes.
   - Example header/body options:
     - `x-access-token: <ACCESS_TOKEN>`
     - `userId: <USER_ID>`
   - Admin routes remain separate and use `ADMIN_PASS` instead of `userId`.

Environment Variables

- `MONGO_URI` — MongoDB connection string.
- `REDIS_URL` — Redis connection string.
- `ACCESS_TOKEN` — shared access token for frontend requests.
- `ADMIN_PASS` — admin password for admin-only routes.

# GitHub OAuth Setup (SkillBridge)

This setup enables GitHub login in SkillBridge while keeping Spring Security + SkillBridge JWT as the internal auth model.

## 1. Create a GitHub OAuth App

1. Open GitHub in your browser.
2. Go to `Settings` -> `Developer settings` -> `OAuth Apps`.
3. Click `New OAuth App`.
4. Fill:
   - `Application name`: for example `SkillBridge Local`
   - `Homepage URL`: `http://localhost:5173`
   - `Authorization callback URL`: `http://localhost:5173/login`
5. Click `Register application`.

## 2. Get Required Credentials

From the OAuth App page copy:

- `Client ID`
- `Client Secret` (click `Generate a new client secret` if needed)

## 3. Configure SkillBridge Environment

Use the same callback URL in both frontend and backend.

### Backend (`apps/backend/.env`)

```properties
GITHUB_CLIENT_ID=<YOUR_GITHUB_CLIENT_ID>
GITHUB_CLIENT_SECRET=<YOUR_GITHUB_CLIENT_SECRET>
GITHUB_REDIRECT_URI=http://localhost:5173/login
```

### Frontend (`apps/frontend/.env`)

```properties
VITE_GITHUB_CLIENT_ID=<YOUR_GITHUB_CLIENT_ID>
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login
```

## 4. Run and Test

1. Restart backend after editing `.env`.
2. Restart frontend after editing `.env`.
3. Open `http://localhost:5173/login`.
4. Click `Continue with GitHub`.
5. Approve access in GitHub.
6. You should return to `/login`, then get redirected into the app as an authenticated user.

## 5. Backend Endpoint and Behavior

- Endpoint: `POST /api/auth/github`
- Request payload:

```json
{
  "code": "<authorization code from github>",
  "redirectUri": "http://localhost:5173/login"
}
```

Backend flow:

- exchanges code at `https://github.com/login/oauth/access_token`
- fetches profile from `https://api.github.com/user`
- fetches emails from `https://api.github.com/user/emails` if needed
- requires a verified email
- creates local user on first login
- issues normal SkillBridge JWT

## 6. Common Errors

- `GitHub OAuth is not configured on the server.`
  - Missing backend env values (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, or `GITHUB_REDIRECT_URI`).
- `GitHub OAuth redirect URI is not allowed.`
  - Frontend `VITE_GITHUB_REDIRECT_URI` does not exactly match backend `GITHUB_REDIRECT_URI`.
- Redirect mismatch error on GitHub page
  - GitHub OAuth App callback URL does not match the redirect URI used by frontend/backend.
- Login fails after authorization
  - Check backend logs for token exchange or email verification errors.

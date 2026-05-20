# Google OAuth Setup (SkillBridge)

This guide configures Google sign-in for SkillBridge's current architecture:

- Frontend receives a Google ID token using Google Identity Services.
- Backend verifies that token and issues the normal SkillBridge JWT.

## 1. Create or Select a Google Cloud Project

1. Go to Google Cloud Console: `https://console.cloud.google.com/`
2. Use the top project selector to create or choose a project.

## 2. Configure OAuth Consent Screen

1. Go to `APIs & Services` -> `OAuth consent screen`.
2. Choose `External` if this is not a Google Workspace internal app.
3. Fill required fields:
   - App name (for example: `SkillBridge`)
   - User support email
   - Developer contact email
4. Save and continue through scopes/test users.
5. If your app is in `Testing`, add test user Gmail accounts under `Test users`.

## 3. Create OAuth Client ID (Web)

1. Go to `APIs & Services` -> `Credentials`.
2. Click `Create Credentials` -> `OAuth client ID`.
3. Application type: `Web application`.
4. Name example: `SkillBridge Local Web`.
5. In `Authorized JavaScript origins`, add:
   - `http://localhost:5173`
6. In `Authorized redirect URIs`, you can leave empty for this integration (GIS ID token flow), or add:
   - `http://localhost:5173`
7. Click `Create`.
8. Copy the `Client ID` value.

## 4. Put Client ID in SkillBridge Config

Use the same client ID in frontend and backend:

### Frontend (`apps/frontend/.env`)

```properties
VITE_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_WEB_CLIENT_ID>
```

### Backend (`apps/backend/.env`)

```properties
GOOGLE_ALLOWED_AUDIENCES=<YOUR_GOOGLE_WEB_CLIENT_ID>
```

If you use multiple client IDs (for multiple domains/environments), separate by commas:

```properties
GOOGLE_ALLOWED_AUDIENCES=id1.apps.googleusercontent.com,id2.apps.googleusercontent.com
```

## 5. Run the Apps

1. Start backend.
2. Start frontend.
3. Open login page (`/login`).
4. You should see a Google sign-in button.

## 6. What Tokens You Need (and Do Not Need)

- Needed:
  - `Google OAuth Web Client ID`
- Not needed for this implementation:
  - Google Client Secret
  - Refresh token from Google

The backend endpoint is:

- `POST /api/auth/google`

Body:

```json
{
  "idToken": "<google id token>"
}
```

## 7. Troubleshooting

- `Google OAuth is not configured on the server.`
  - Set `GOOGLE_ALLOWED_AUDIENCES` in backend `.env`.
- `Google token audience is not allowed.`
  - `GOOGLE_ALLOWED_AUDIENCES` does not match the frontend `VITE_GOOGLE_CLIENT_ID`.
- Button not visible on `/login`
  - Ensure `VITE_GOOGLE_CLIENT_ID` is set.
  - Restart frontend after changing `.env`.
- Popup closes and login fails
  - Make sure the origin in Google console exactly matches the frontend origin and port.

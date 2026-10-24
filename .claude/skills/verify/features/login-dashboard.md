# Account login and dashboard

## Sub-features

- Existing AzerothCore account sign-in.
- Session-backed dashboard access.
- Logout and session invalidation.

## How to get to it (user POV)

Open `/login`, enter a disposable configured account, and submit `Sign in`. After the redirect, use the dashboard navigation and then log out.

## Driving it with browser automation and curl

Require deep health first. Fill the `username` and `password` fields in the browser, submit the visible button, and capture the final URL and dashboard screenshot. Log out through the visible control and confirm that opening the dashboard no longer shows the authenticated state.

## Gotchas

The app uses HTTP-only session cookies. Do not extract or print the cookie. If login fails, inspect the redacted response and server log, then distinguish invalid credentials from database or schema failures.

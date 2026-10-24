# Public landing and auth entry points

## Sub-features

- Landing page realm status, rates, and navigation.
- Login form rendering.
- Registration form rendering when `WOW_REGISTRATION_ENABLED=true`.

## How to get to it (user POV)

Open the app root. Use the visible `Sign in` or `Create account` links.

## Driving it with browser automation and curl

Open `/`, assert the visible `Realm`, `Players online`, and `Realmlist` labels, then follow the two navigation links. Assert the `/login` and `/register` headings and their labeled fields. Run `./scripts/verify-web.sh capture-public` to retain the matching HTTP responses.

## Gotchas

The landing page queries the characters database for online count and shows `Unavailable` when that read fails. The page can still render. Registration is hidden with a not-found response when `WOW_REGISTRATION_ENABLED` is false.

# Account registration

## Sub-features

- AzerothCore username and email registration.
- Password confirmation and session creation.

## How to get to it (user POV)

Open `/register` from the landing page. Enter a unique disposable username, email, password, and matching confirmation, then submit `Create account`.

## Driving it with browser automation and curl

Require `GET /api/health?deep=1` to return HTTP 200. Use a real browser to fill the fields by their `name` values and submit the form. Assert the resulting redirect and signed-in navigation. Confirm the account effect with the resulting user-visible page or a read-only authorized check.

## Gotchas

This journey needs writable access to the configured AzerothCore auth database and the web database. A failed deep-health check is a prerequisite failure. Never reuse a real account or write credentials to evidence.

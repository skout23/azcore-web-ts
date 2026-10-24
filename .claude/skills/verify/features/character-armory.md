# Character armory browsing

## Sub-features

- Character list for the signed-in account.
- Character detail data such as equipment, stats, talents, achievements, skills, mounts, and model assets.

## How to get to it (user POV)

Sign in, open the character list from the authenticated navigation, and select a character with seeded AzerothCore character data.

## Driving it with browser automation and curl

Require deep health and a disposable account with at least one character. Open `/characters`, select a visible character, and assert the detail route renders the character name and at least one data section. Capture the page after navigation and verify the corresponding read-only character data is unchanged.

## Gotchas

This journey depends on the configured `DB_CHAR_*` schema and compatible AzerothCore tables. An empty character database is a missing precondition, not a reason to accept an empty success page.

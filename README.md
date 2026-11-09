<p align="center"><img src="assets/logo.png" alt="Syncord" width="200"></p>

# Syncord

> **Originally built in April 2022.** Uploaded to GitHub in November 2026 as an archive of my early work. The commit dates match the original file timestamps. The code is as it was in 2022, except that the bot token and OAuth credentials in `settings/` were replaced with placeholders.

Syncord was a subscription-based SaaS for Discord server owners: a member backup and restore service. Members verify once through Discord OAuth2, and if the server is raided, deleted or banned, the owner can pull those members into a new server automatically.

## How it works
- A server owner adds the Syncord bot and posts a verification message with a **Verify** button.
- Members authorize with Discord OAuth2 (`identify`, `guilds`, `guilds.join`). Their access and refresh tokens are stored and linked to that server.
- With the `syncord` command, the owner restores linked members into a new server through `guilds.join`, refreshing expired tokens automatically.
- Subscription plans limit how many servers an owner can link. A daily job checks expiring subscriptions and reminds staff.

## Stack
Node.js, discord.js v13, Express + EJS, Passport (`passport-discord`, `passport-oauth2-refresh`), MySQL (`mysql2`).

## Structure
```
Syncord.sql             database schema (users, guilds, links, backups, plans, subscriptions, ...)
settings/               Discord, OAuth, Express and MySQL settings
source/syncord.js       entry point
source/client/          bot client, commands and events
source/server/          OAuth2 web server, routes and views
source/functions/       member restore and helpers
source/utils/           Discord API/OAuth helpers, subscription expiry checker
source/database/        MySQL connection and table manager
```

## Running it
1. Import `Syncord.sql` into MySQL.
2. Fill in `settings/` with your own bot token, OAuth client ID/secret, callback URL and database credentials.
3. `yarn install`, then `yarn start`.

## Author
Ghaith (icxaith), 2022

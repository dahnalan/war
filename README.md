# WaR VS Planner - Worker version v4

This update changes player handling and fixes the write flow design:

- Player entry now starts from an admin-created player dropdown.
- Admin is the only one who can create player profiles.
- Players set and manage their own 6-digit code.
- Admin can see last login time.
- Admin can reset a player's code.
- Backend now includes a dedicated `players` table and safer JSON error responses.

## Why writes may have failed before

If reads worked but writes failed, the most likely cause was a schema mismatch after the app started sending new fields such as `player_pin` or later `player_id`. This version adds a proper `players` table and updated submission structure, so you must update the D1 schema. [web:143][web:145]

## Required database update

Run the updated schema against your D1 database:

```bash
npx wrangler d1 execute xclash-vs-planner-db --file=schema.sql
```

If you already have an older `submissions` table without `player_id`, the quickest clean path is usually:

```sql
DROP TABLE submissions;
DROP TABLE players;
```

then rerun `schema.sql`.

## Deploy steps

1. Replace your repo with this updated version.
2. Push to GitHub.
3. Redeploy the Worker.
4. Run the updated schema.
5. In Admin, create player profiles first.
6. Players then set their own 6-digit code and save/edit entries.


## New in v5

- Player data stays locked until the correct 6-digit code is entered for the selected player.
- Admin announcement banner appears at the top of the home page.
- Desktop slot layout was adjusted so time labels align correctly and do not overflow awkwardly.
- New `app_settings` table stores the announcement banner.

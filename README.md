# WaR VS Planner - Worker version

This version adds the requested changes:

- Player entry is the default tab.
- Players choose a VS day and then see that day's activities.
- Each player enters their own point value per activity, because values can differ by player.
- Admin area can define activities per VS day and set default points.
- Players can save and later edit with player name + simple 6-digit code.
- Guild role removed.
- Dashboard is protected using the same admin secret/password variable.
- White/light theme only.
- Mobile-first layout.
- WaR branding and X-Clash-inspired visual direction.

## Important database update

Because submissions now store `player_pin` and the activity input structure changed, run the schema again on your D1 database.

```bash
npx wrangler d1 execute xclash-vs-planner-db --file=schema.sql
```

If your current `submissions` table already exists with the old structure, the quickest path is often:

```sql
DROP TABLE submissions;
```

then rerun `schema.sql`.

## Deploy

1. Replace your GitHub repo files with this version.
2. Push to GitHub.
3. Redeploy the Worker.
4. Run the updated schema if needed.
5. Keep using the same `ADMIN_SECRET` Worker variable.

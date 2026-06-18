# WaR VS Planner - Worker version v7

This version includes these updates:

- `wrangler.toml` now includes the D1 database ID: `1f58e8e9-5f79-4fde-aa3e-ed770db76c46`.
- Only one VS entry is allowed per player per VS day. Saving again updates that day's existing record.
- Player entry is simplified into a guided flow: choose player, enter/set 6-digit code, then choose VS day, time slots, and VS points.
- The player screen is now less complex and more step-driven.

## Required database note

Because this version adds a `UNIQUE(player_id, vs_day)` rule, your existing `submissions` table may need to be recreated if it was built from an older schema.

Recommended clean approach if you are still iterating:

```sql
DROP TABLE submissions;
```

Then rerun:

```bash
npx wrangler d1 execute xclash-vs-planner-db --file=schema.sql
```

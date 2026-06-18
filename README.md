# xclash-worker-project-16

This build is the safe follow-up from the working v15 baseline.

Included changes:
- Admin can delete activities per VS day.
- Admin no longer sees or edits technical activity keys.
- Category is removed from the admin UI.
- Activities are defined by label + points per 1 item.
- Save/update feedback is added for player save, player code save, player create, announcement save/clear, formula save, admin unlock, and dashboard unlock.

## Database commands

This version does not require a full database drop.

Run the schema again to ensure tables exist:

```bash
npx wrangler d1 execute xclash-vs-planner-db --file=schema.sql
```

If you want to fully reset only the VS day definitions so you can re-enter them cleanly in the new simpler format:

```bash
npx wrangler d1 execute xclash-vs-planner-db --command "DELETE FROM day_formulas;"
```

Then either re-enter the formulas in the Admin page, or seed them again if you have a seed script.

If you decide you want a total reset of all stored app data:

```bash
npx wrangler d1 execute xclash-vs-planner-db --command "DELETE FROM submissions;"
npx wrangler d1 execute xclash-vs-planner-db --command "DELETE FROM players;"
npx wrangler d1 execute xclash-vs-planner-db --command "DELETE FROM day_formulas;"
npx wrangler d1 execute xclash-vs-planner-db --command "DELETE FROM app_settings;"
```

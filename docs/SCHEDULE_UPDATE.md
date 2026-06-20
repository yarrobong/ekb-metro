# Schedule Update

## Source of truth

Local schedule data lives in:

- `src/data/schedule.ts`
- `src/data/stations.ts`
- `src/data/directions.ts`
- `src/data/driveTimes.ts`
- `src/data/specialDates.ts`
- `src/data/metadata.ts`

Official source for verification:
[metro-ektb.ru/rezhim-raboty-metropolitena-grafik_1211](https://metro-ektb.ru/rezhim-raboty-metropolitena-grafik_1211/)

## Rules

- Do not invent train times.
- Do not bulk-rewrite thousands of values for cosmetic reasons.
- Do not replace real schedule data with placeholders or mock values.
- Keep operational-day semantics intact for after-midnight trains.

## Update flow

1. Update only the confirmed values in `src/data/*`.
2. Adjust `checkedAt` or related metadata if appropriate.
3. Run:

```bash
npm run validate:data
npm run test:run
npm run build
```

4. Review the diff carefully to ensure no accidental schedule corruption.

## Review checklist

- Station order remains fixed.
- Direction IDs remain unchanged.
- Validation reports 0 errors and 0 warnings.
- No unrelated app logic changes are mixed into the schedule update commit unless necessary.

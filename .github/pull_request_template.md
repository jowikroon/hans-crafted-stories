## What does this PR do?

<!-- Brief description of the change -->

## Impact measurement

<!-- Changes something a visitor or Google sees? Name the Linear issue (HAN-123) and fill in one
Measure line. After merge, site-metrics measures before vs after against the rest of the site
and shows the verdict on /dashboards/hvl. Leave the line out for internal-only changes.
metric: search_impressions | search_clicks | search_ctr | search_position | visits | engaged_rate | leads | lead_rate
paths: comma-separated, /x/* is a prefix, empty = whole site. days: measurement window (7-180). -->

Measure: metric=search_impressions paths=/example expect=up days=28

## Checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Types check (`npx tsc --noEmit`)
- [ ] Tests pass (`npm run test`)
- [ ] Tested manually in the browser

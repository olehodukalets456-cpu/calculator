# Buying Profitability Calculator

Static UA/EN calculator served at https://leadsuni.site through GitHub Pages.
There is no application server or build step. `index.html` loads the v10 modules
and then the v11 traffic-mode implementations; initialization runs once after
all implementations are defined. Older `app-*`, `brand-*` and `patch-*` files
are historical and are not loaded by the current page.

## Calculation contract

- Budget, agency fee and fixed costs refer to the same period. Fixed costs are
  counted once in both scaling and cohort forecasts.
- Starting volume = ad spend / CPC or the known cost of the selected stage.
  In stage mode no earlier counts or CPC are inferred. Only subsequent rates apply.
- Paid results = final funnel count × approval × (1 − refund).
- Unit contribution = result revenue × (margin − payment fee − revenue tax).
  Percentages are divided by 100; negative contribution remains negative.
- Acquisition costs = ad spend × (1 + agency fee) + fixed costs.
- Profit = paid results × unit contribution − acquisition costs.
- ROI = profit / acquisition costs × 100; ROAS = revenue / ad spend.
  ROI here measures return on acquisition costs, not on COGS-inclusive costs.
- Cost ceilings hold the entered budget and funnel rates constant. Break-even
  paid CPA = spend × unit contribution / acquisition costs. Break-even starting
  cost = that CPA × paid results / starting volume. Negative ceilings display 0,
  accompanied by an explanation that unit economics cannot break even.
- Zero conversions, zero revenue, zero margin and 100% refunds are valid losses.
  Undefined ratios are shown as an em dash, never as invented zeroes.
- Brand result value and activity have distinct blank/zero semantics: blank is
  unknown, zero is known. A target cost is required only without a result value.
- Scaling raises starting cost and lowers the **overall downstream CR** once per
  budget doubling. A final-stage anchor has no downstream CR to lower. The ceiling
  solver checks the profit peak, including models initially losing to fixed costs;
  constant profitable unit economics have no finite upper ceiling.
- Cohorts retain `1 − churn` after each month, earn the first month's contribution
  before churn, and subtract acquisition costs once. Payback is contribution
  payback, excluding payout delays. Lifetime and churn are separate assumptions;
  cohort revenue is not capped by the separate EdTech total-revenue input.
- Hold is a delay, not a complete cash-flow schedule. Future LTV is not reported as
  a lump-sum held payout. Continuous-spend cash reserves cannot be determined
  without daily spending and receipt dates.
- Currency changes relabel amounts; they do not perform FX conversion.

## Saved scenarios and exports

Scenario comparison stores immutable result snapshots, preserving their own
currency. Old CPC snapshots migrate their cost field but are not recalculated
because they do not contain full inputs. Re-save a scenario to refresh its
results after a formula update.

Links share only the current vertical's inputs and funnel; opening a link does
not overwrite other verticals. Stored state and links are normalized before use.
The calculator remains usable when localStorage or clipboard access is denied.

CSV/Sheets contain numeric results, units, funnel volumes and enabled cohorts.
User-controlled text is escaped against spreadsheet formulas. PDF values use the
same result helpers. If PDF CDN libraries are unavailable, the report prints in
the current tab; no popup is required. PDF page slices avoid splitting table rows
and report boxes when those blocks fit on a page.

## Checks

Requires Node 22.13+ (Node 24 used for validation):

```sh
npm ci --ignore-scripts
npm test
```

36 regression checks cover math and DOM interactions, including 80 combinations
of vertical, language, currency and traffic mode. Tests also exercise every
Lead Generation anchor, actual break-even substitution, retention extremes,
shared-link round trips, blocked storage, CSV safety and PDF print fallback.
jsdom is a development-only dependency. The site has no runtime npm dependencies.

Deployment remains the existing GitHub Pages flow from `main`. Assets carry a
release query key in `index.html`. Do not re-run the historical unpack workflow
or update its archived bundle to publish current changes: that archive predates
the current source and can overwrite it. Publish source commits instead.

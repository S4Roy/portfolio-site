# Project evidence for the CV

Reviewed the local ELEXIFY and Rudraksha Valley checkouts to refine project descriptions. Source files show implementation and test scope; they do not independently establish authorship, deployment status, business volume or test pass rates.

## ELEXIFY

Root: `/Users/subhankar/Projects/Elexify/eCommerce`

- Stack: `elexify.online/package.json`, `elexify-admin-panel/package.json`, `elexify-backend/package.json`, `elexify-mobile/package.json` — Next.js/React, Angular, Express/Mongoose, React Native/Expo, Vitest/Supertest, Playwright and Jest.
- Transactional stock changes, reservations and atomic updates: `elexify-backend/src/services/stock/mutations.js`.
- Replay-safe payment finalization and transaction coordination: `elexify-backend/src/services/orderService/finalizeCapturedPayment.js`.
- Checkout concurrency, final-unit contention and lost-response recovery test cases: `elexify-backend/src/services/orderService/httpCheckoutConcurrency.integration.test.js`.
- Checkout and return browser tests: `elexify.online/e2e/critical-checkout.spec.ts`, `elexify.online/e2e/return-module.spec.ts`.
- Mobile checkout idempotency tests: `elexify-mobile/tests/checkout-idempotency.test.ts`.
- Build/test automation: `.github/workflows/` within the backend, storefront and admin projects. These support CI wording; they are not evidence of automated production deployment.
- July 2024 start, 600+ monthly orders, INR 400,000+ monthly sales and approximately 170 permissions are user-supplied CV facts; business figures were not inferred from repository content.

## Rudraksha Valley

Root: `/Users/subhankar/Projects/RudrakshaValley`

- Stack: the three application `package.json` files — Next.js storefront, Angular admin, Express/Mongoose backend, Vitest and Supertest.
- Custom product configuration and price validation: `rudraksha-valley-backend/src/controllers/site/inventory/product/customiseMalaCartManage.js`; storefront UI: `rudrakshavalley.com/src/components/cms/CustomizedMalaPage.tsx`.
- GeoIP currency selection: `rudraksha-valley-backend/src/controllers/site/common/detectCurrency.js`.
- Payment and shipping integrations: backend `src/services/paymentService/` and `src/services/shiprocket/`.
- Merchant feed route: `rudrakshavalley.com/src/app/feed.xml/route.ts`; associated merchant-feed routes and sitemap routes in `src/app/`.
- GA4 commerce event tests: `rudrakshavalley.com/src/core/lib/gtag.test.ts`.
- S3/media processing: backend `src/services/s3Handler/`.
- CI test/build declarations: `.github/workflows/ci.yml` within each application. Workflows were inspected, not executed.

## Verification limits

No production systems were accessed and neither project was modified or tested. No test coverage, latency, uptime, revenue growth or conversion uplift was invented. The CV retains the user's confirmed business metrics and original employment facts. Rudraksha Valley's project dates remain unspecified pending confirmation.

## SFTravelDesk update

- User confirmed SFTravelDesk serves 2,500+ employees and provided https://sftraveldesk.com/.
- The supplied dashboard screenshot shows trip and expense reporting across 5 group companies, including approvals and reimbursements; the navigation also shows advances.
- Employee reach is user-confirmed; it is not inferred from the trip count. No monthly volume, processing-time improvement or savings was inferred from the screenshot. Earlier references to approximately 500 employees in the CV and portfolio were replaced with the more specific SFTravelDesk reach.

## Additional user-supplied links and dashboard snapshots

Project links supplied by the user were added as named hyperlinks in the CV and grouped by employer in the portfolio. Demo and staging labels are retained. Link availability and authenticated content were not checked.

- SFTNirman: https://sftnirman.com/
- SFTWarehouse SSO: https://sso.sftwarehouse.com/
- SFTDox demo: https://demo.sftdox.com/
- SFT Evolve demo: https://demo.sftevolve.com/
- SFTVault staging: https://staging.sftvault.com
- Scaffold Mart: http://scaffoldmart.co.uk/
- Andrew Yule intranet: https://ayule.andrewyule.in/intranet
- CalGamesWanted: https://application.calgameswanted.com/
- SignLix: https://signlix.com/
- Vrasio: https://vrasio.com/
- Seabrin LMS: https://lms.seabrin.in/
- Healthy Hearing: https://hh.baseweb.in/
- Related BRRPL audiometry deployment: https://brrpl.audio.baseweb.in/

The supplied Seabrin dashboard shows 5,716 trips, 30,538 fixed trips and 355 vendors. These are separate dashboard totals, not monthly counts, completed-trip counts or figures restricted to the user's 2021–2022 contract. The CV labels them as the current platform footprint and does not sum potentially overlapping categories.

The supplied Healthy Hearing dashboard shows 7,766 total patients, 2 centers and 5 audiologists. The CV describes these as the current deployment's record/staff scale, not as patients personally treated or volume achieved during the 2020 contract. BRRPL is listed only as a related audiometry deployment; no additional employer, dates, patient totals or impact are inferred from its charts.

## Final CV refinement

- Separated Shyam Steel (31 Oct 2025–31 Oct 2026) and Shyam Future Tech (7 Mar 2024–30 Oct 2025) at the confirmed transition boundary. Achievements remain explicitly shared across both employers because individual project delivery dates were not supplied.
- Moved current Seabrin and Healthy Hearing dashboard totals to a distinct current-deployment section, outside historical employment bullets.
- Reduced CV links to selected examples. All supplied links remain in portfolio data and in this evidence record; demo, staging and intranet links are omitted from the condensed CV.
- Focused the skills section on the principal stack and repository-supported testing tools. Rudraksha Valley dates remain unspecified.
- Increased PDF body text to 10 pt and retained a two-page layout.

## Employer grouping requested by the user

The final CV groups Shyam Future Tech Pvt. Ltd and Shyam Steel Industries Ltd into one continuous MEAN Stack Developer entry (Mar 2024–Oct 2026). The note records joining Shyam Future Tech on 7 Mar 2024 and transitioning to Shyam Steel on 31 Oct 2025, with continuous product responsibilities through 31 Oct 2026. This supersedes the separate entries described in the earlier refinement note.

## AI-assisted development

The user confirmed active use of Claude Code and OpenAI Codex for ongoing work on the selected projects and reported shorter development time. The CV lists both tools and describes the improvement qualitatively; no percentage or hours-saved figure is claimed. This describes current development practices, not tool use during earlier employment periods.

## Freelance work clarification

The user confirmed the projects were extra freelance work undertaken after office hours. The CV now labels the section FREELANCE PROJECTS and explicitly distinguishes this part-time client work from full-time employment. Existing individual project dates and freelance labels are retained.

## Freelance presentation refinement

The freelance introduction now reads "Selected part-time freelance engagements" and retains the qualitative AI-assisted development statement. Logistics and audiometry dashboard totals are now in a separate CURRENT PLATFORM SCALE section, explicitly associated with earlier employment, rather than nested under freelance projects. No new freelance engagement is implied.

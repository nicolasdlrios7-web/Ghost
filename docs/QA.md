# Ghost release verification

Verified on macOS / Apple Silicon, 15 September 2026.

## Results

| Check | Result |
| --- | --- |
| TypeScript and production bundles | Pass — `npm run build` |
| Unit tests | Pass — 5 tests |
| Electron end-to-end tests | Pass — 2 tests |
| Foreground macOS app observation | Pass — genuine live session recorded in desktop test |
| Onboarding, all five pages, sample analysis | Pass |
| Evidence and annual savings math | Pass — 4 repeats, 12 evidence sessions, 38 × 52 / 60 ≈ 33 hours |
| Workflow creation and activation | Pass |
| Local draft generation | Pass — supplied metrics appear in generated output |
| Pause and resume workflow | Pass |
| Persistence across Electron relaunch | Pass |
| Reset demo and delete activity | Pass |
| No API key path | Pass |
| AI success and malformed response fallback | Pass with intercepted response fixtures |
| macOS DMG and ZIP | Pass — `npm run dist` |
| Packaged Ghost.app | Pass — launch, sample analysis, workflow activation, no renderer errors |
| DMG checksum verification | Pass — `hdiutil verify` |
| Dependency audit | Pass — zero reported vulnerabilities at verification time |
| Visual review | Home, opportunities, evidence, workflow, and activation screenshots inspected |

## Reproduce

```bash
npm test
npm run test:e2e
npm run dist
node scripts/smoke-package.mjs
hdiutil verify release/Ghost-1.0.0-arm64.dmg
```

Tests use temporary isolated data folders. AI test credentials are explicit fixtures, and the test replaces main-process fetch before initiating analysis; it does not contact OpenAI. There was no live paid API request during release verification because no user credential was supplied.

## Product audit

- **Clarity:** Home leads with the product promise and a single evidence-backed opportunity.
- **Demo speed:** The complete automated desktop test, including restart and live observation, runs in under 30 seconds; a narrated product loop fits 60–90 seconds.
- **Credibility:** Sample activity, estimated savings, manual draft execution, and future integrations are labeled in the interface.
- **Privacy:** AI is opt-in and explicitly triggered. Titles are off by default. No keyboard or screen capture code exists.
- **Reliability:** Local detection and bundled fonts make the primary demo independent of network services.
- **Simplicity:** One local store, one detector, a narrow IPC bridge, and a React UI. No external accounts or infrastructure.

## Known limits

- Apple Silicon build tested; Intel, Windows, and Linux releases are not tested.
- Unsigned and unnotarized. Gatekeeper may require explicit user approval for a downloaded copy.
- Optional window-title permission and launch-at-login behavior depend on macOS settings and were not exercised in automated tests.
- App foreground time is approximate context, not a measure of productive work. An app sequence alone cannot establish user intent.
- Savings and confidence are estimates. Weekly frequency is an explicit prototype assumption.
- Workflow schedules and external integrations are proposed only. Active workflows run manually with supplied context. The local runner formats/extracts content; it does not claim LLM-authored reports or fetched service data.
- Real OpenAI transport is implemented but was not exercised with a paid key. Valid and malformed response paths were tested through the actual main-process analysis handler using fixtures.

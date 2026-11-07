# CI trust boundary (central daodaoedu/daodao#502)

Source snapshot: server `40080683` (origin/dev, 2026-11-08). This document records source/configuration evidence, not an Actions penetration-test result.

## Event and permission matrix

| Event | Executed revision / authority | Private material / artifact | Required checks / deployment |
|---|---|---|---|
| External fork `pull_request` | PR merge revision; PR-owned scripts execute. GitHub fork restrictions normally remove repository secrets and downgrade the token. Local quality YAML explicitly requests only contents:read. | Private storage checkout requires unavailable PAT; **full fork quality path is unresolved**, not a planned passing skip. Existing generated-files upload is not proof of artifact confidentiality. | `test`, `workflow-tests`, `Compare SQL ↔ Prisma schemas` must genuinely pass. No deployment event. |
| Same-repository `pull_request` | PR merge revision; same-repo branch and workflow can change install/test commands. Branch authors therefore remain inside the current secret trust boundary. | Storage PAT supplied to checkout; storage files exist on runner. All quality checkouts now opt out of retained Git credentials, but this does **not** prevent malicious workflow edits or scripts reading checked-out private files. | Same required quality gates; no deployment event. |
| Trusted push to dev/main/production | CD workflow at pushed revision calls CI at that revision. | Caller passes inherited secrets; generated-files artifact consumed by CD within the calling run. Existing artifact provenance and content safety still require full runtime validation. | CI gate then build/deploy under existing CD policy. No new deployment permission granted. |
| `workflow_call` | Caller determines revision and passed secret authority. Current CD caller is local workflow reference. | Local CI read token; private checkout still needs caller-supplied PAT. Reusable output is artifact name, not proof of origin. | CI itself does not deploy; caller separately decides deployment. |
| CI dispatch / schedule | Dispatched/default-branch workflow revision respectively. | Trusted repository secrets; private integration schema and generated artifact. | Full CI selection on non-PR events; CI itself does not deploy. |
| Schema dispatch / schedule | Selected/default workflow revision; paired dispatch revisions validated as 40-character SHAs. Default storage ref remains mutable `dev`. | PAT checkout with persistence disabled. Immutable approved schema source is **not yet established** by this change. | Schema check; paired journeys only for explicit dispatch inputs; no deployment in schema workflow. |
| Rerun | Existing run revision and event context; rerun does not convert fork code into trusted code. | Do not assume maintainer rerun grants a fork secrets. Actual canary test not executed. | Same checks; no new event-based deployment route introduced. |

Repository readback showed `default_workflow_permissions: read`, review approval disabled. Benchmark ruleset required contexts: `test`, `workflow-tests`, `Compare SQL ↔ Prisma schemas`, `PR evidence（驗證報告 + 核心旅程）`. This patch changes none of these settings.

## Other consumers

- PR evidence uses `pull_request_target` with contents:read, downloads gate scripts from the default branch, and treats PR body/labels as data. It does not checkout PR code. Keep this boundary.
- AI review uses `pull_request` labeled events, extracts runtime from the base SHA and does not install PR dependencies. Job explicitly has PR/check write scopes; provider token is step-scoped. Fork secrets/write restrictions and real run behavior still need synthetic remote verification. Source review is not a guarantee that a same-repo PR cannot modify the workflow itself.
- Existing journey reusable workflow and CD workflows remain unchanged. This narrow hardening is not a full audit of their artifact/secret boundaries.

## Narrow hardening and limits

`actions/checkout@v4` defaults to keeping its credential in Git configuration until post-job cleanup. Disabling persistence on **every** CI/schema checkout removes that credential from later repository-controlled commands. Both quality workflows explicitly request contents:read, so broader repository defaults cannot silently expand their token scope. Regression tests inspect parsed workflow behavior invariants, including every checkout, rather than matching formatting.

This does not isolate arbitrary repository code from every same-job secret, certify PAT scopes, conceal files already checked out, or provide a complete runnable fork integration path. Do not mark #502 complete on this patch alone. Remaining work needs an approved immutable non-sensitive schema fixture, a decision on branch/secret trust, and an approved synthetic fork/secret environment. Do not solve fork failures by skipping required gates or switching to privileged PR-head execution.

References: [checkout v4 credential behavior](https://github.com/actions/checkout/tree/v4), [GitHub token permissions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication), [fork PR workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request). Checkout documentation retrieved through Groundlane; bounded content included credential defaults, not the entire README.

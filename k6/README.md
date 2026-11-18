# k6 — performance tests

```
k6/
├── lib/
│   ├── config.js        # target (BASE_URL), load profiles (smoke | load), thresholds
│   └── summary.js       # end-of-test summary → console + reports/k6/<scenario>.json / .md
└── scenarios/
    ├── products-api.js  # list products → open one → search
    └── auth-flow.js     # log in → GET /auth/me with the token
```

```bash
brew install k6                      # https://grafana.com/docs/k6/latest/set-up/install-k6/
npm run k6:smoke                     # 1 user, 30 s per scenario
npm run k6:load                      # up to 10 users, 2 min per scenario
k6 run -e PROFILE=load -e BASE_URL=https://<your-env> k6/scenarios/products-api.js
```

A failed threshold makes k6 exit with code 99, which fails the `Performance (k6)` workflow. Details: README section 12.

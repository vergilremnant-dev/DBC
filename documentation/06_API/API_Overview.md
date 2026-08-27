# API Layer Overview

All backend endpoints are routed through the Express app defined in `api-lib/app.ts`.

## 1. Express Request Adaptor
To support Vercel serverless deploys alongside standard Express dev servers, controllers utilize an adaptor:
```typescript
const adapt = (handler) => async (req, res) => {
  const queryVal = Object.assign({}, req.query, req.params);
  Object.defineProperty(req, 'query', {
    value: queryVal,
    writable: true,
    configurable: true
  });
  try {
    await handler(req, res);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
```

## 2. Global Middleware Chain
*   **JSON Parser:** `express.json()` is conditionally applied to parse inbound JSON body payloads.
*   **CORS Configuration:** Enforced via Vercel header config matching `/api/(.*)`.

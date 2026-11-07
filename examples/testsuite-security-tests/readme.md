# OpenAPI security regression tests

This example turns the security rules already written in your OpenAPI document into tests: which operations need credentials, which fields a response may contain, and which inputs are valid. The checks are mapped to the [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) and run in Newman next to your contract tests, so a regression fails the build.

It only uses existing Portman features (contract tests, variations, fuzzing, content tests and `extendTests`). Copy `portman-config.security.json` and merge it into your own Portman config.

_use-cases_:

- An endpoint that forgets its auth middleware fails on the next build, even when the spec documents no 401 response
- A response that starts returning a field the spec doesn't declare (a `password_hash`, an internal note) fails the schema check
- Out-of-spec input that crashes the API (5xx) or is accepted (2xx) instead of rejected (4xx) is reported
- Missing security headers and stack disclosure are reported

AI agents call APIs with valid credentials, at volume, and with inputs no human would type. Whatever the API allows, an agent will eventually do. These checks test what the API allows.

## CLI usage

```ssh
portman --cliOptionsFile ./examples/testsuite-security-tests/portman-cli-options.json
```

Add `--runNewman` (and a real `baseUrl` plus a valid `bearerToken`) to run the tests.

## The checks

| Check | How | OWASP |
| --- | --- | --- |
| No undeclared response fields | `schemaValidation` with `additionalProperties: false` | API3 |
| Rejected without credentials (401/403) | variation with `overwriteRequestSecurity.remove`, asserted with `extendTests` | API2 |
| Rejected with invalid credentials (401/403) | variation with a forged bearer token, asserted with `extendTests` | API2 |
| No stack traces in error bodies | `extendTests` on the no-credentials response | API3, API8 |
| Out-of-spec input gets a 4xx, not a 5xx or 2xx | `fuzzing` variation (required fields, minimum/maximum, minLength/maxLength), asserted with `extendTests` | API4, API8 |
| HSTS and `X-Content-Type-Options: nosniff` | `contentTests.responseHeaderTests` | API8 |
| No `X-Powered-By`, no version in `Server`, no `*` CORS with credentials | `extendTests` | API8 |

### Why `extendTests` instead of `openApiResponse: "401"`

A variation that targets `openApiResponse: "401"` is only generated when the operation documents a 401 response. The security variations have no `openApiResponse` and assert the status code with `extendTests`, so every operation gets them. An undocumented endpoint behaviour is exactly what this preset should catch.

### API key instead of bearer

For an `apiKey` security scheme, replace the invalid-credentials overwrite with:

```json
"overwriteRequestSecurity": { "apiKey": { "value": "portman-invalid-key" } }
```

### Strict schema mode

`additionalProperties: false` closes every object schema that declares `properties`. It leaves free-form objects (no `properties`), maps (`additionalProperties` set to a schema) and `allOf` members open, because closing those would reject valid responses.

## What it doesn't do

- It won't find SQL injection, SSRF, XSS or similar. Portman has no attack payloads, so you still need a DAST tool such as ZAP, Burp or StackHawk.
- It only tests what's in the spec. Endpoints the spec doesn't list stay invisible to it.
- Authorization between users (OWASP API1 and API5, who can see whose data) needs variations you write, with real test users per tenant: for example, request another tenant's resource with your token and expect a 403 or 404.
- It never proves an API is secure, only that it matches the spec.

# Contract tests for OpenAPI content types

This example demonstrates how to configure Portman contract tests to target specific
request and response content types defined in an OpenAPI document.
The provided OpenAPI spec exposes a single `/example` endpoint that accepts and
returns XML, JSON and plain text formats.

_use-case_: generate a Postman collection with contract tests for every
combination of request and response content type.

## Try this example yourself using the portman CLI

Download the following files and run portman from this directory:
- [Download OpenAPI spec](./content-types.openapi.yml)
- [Download Portman config](./portman-config.content-types.yml)

```bash
portman --cliOptionsFile ./portman-cli-options.json
```

## Portman configuration settings

The `portman-config.content-types.yml` file contains multiple `contractTests`
entries which showcase different usages of `openApiRequest` and `openApiResponse`.
Each entry targets the same `POST /example` operation but specifies how Portman
should select the request and expected response content type.

```yml
version: 1
tests:
  contractTests:
    - openApiOperation: "POST::/example"
      openApiRequest: "application/json"
      openApiResponse: "200::application/json"
    - openApiOperation: "POST::/example"
      openApiRequest: "application/xml"
      openApiResponse: "200::application/xml"
    - openApiOperation: "POST::/example"
      openApiRequest: "text/plain"
      openApiResponse: "200::text/plain"
    - openApiOperation: "POST::/example"
      openApiRequest: "application/json"
      openApiResponse: "400"
    - openApiOperation: "POST::/example"
      openApiRequest: "*/*"
      openApiResponse: "200::*"
```

### Scenario overview

| Scenario | `openApiRequest` value | `openApiResponse` value | Notes |
|----------|-----------------------|------------------------|------|
| 1 | `application/json` | `200::application/json` | Expect a 200 JSON response when sending JSON |
| 2 | `application/xml` | `200::application/xml` | Expect a 200 XML response when sending XML |
| 3 | `text/plain` | `200::text/plain` | Expect a 200 plain text response when sending plain text |
| 4 | `application/json` | `400` | Expect a 400 response regardless of content type |
| 5 | `*/*` | `200::*` | Use wildcards to test every 200 response content type |

The wildcards `*/*` and `::*` instruct Portman to generate a contract test for
each request or response content type defined in the OpenAPI spec.

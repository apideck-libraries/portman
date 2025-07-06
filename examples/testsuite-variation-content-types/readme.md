# OpenAPI Postman variation test suite - Content-Type scenarios

This example demonstrates how `openApiRequest` and `openApiResponse` can be used
when an API endpoint supports multiple content types. The OpenAPI document
`content-types.openapi.yml` exposes a single `POST /example` operation that
accepts XML, JSON and plain text requests and responds with the same set of
content types for both `200` and `400` responses.

_use-case_: convert the OpenAPI spec to a Postman collection and generate several
variations that explicitly target request and response content-types.

## CLI usage

```ssh
portman --cliOptionsFile ./examples/testsuite-variation-content-types/portman-cli-options.json
```

Configured by using the portman-cli config.

## Portman settings

The `portman-config.ct.json` contains a set of variations demonstrating the
different options for `openApiRequest` and `openApiResponse`.

file: examples/testsuite-variation-content-types/portman-config.ct.json >>

```json
{
  "version": 1.0,
  "tests": {
    "variationTests": [
      {
        "openApiOperationId": "getExample",
        "variations": [
          {
            "name": "jsonRequestJsonResponse",
            "openApiRequest": "application/json",
            "openApiResponse": "200::application/json",
            "tests": {
              "contractTests": [
                {
                  "statusCode": { "enabled": true },
                  "jsonBody": { "enabled": true },
                  "schemaValidation": { "enabled": true }
                }
              ]
            }
          },
          {
            "name": "xmlRequestXmlResponse",
            "openApiRequest": "application/xml",
            "openApiResponse": "200::application/xml",
            "tests": {
              "contractTests": [
                {
                  "statusCode": { "enabled": true },
                  "contentType": { "enabled": true }
                }
              ]
            }
          },
          {
            "name": "textRequestTextResponse",
            "openApiRequest": "text/plain",
            "openApiResponse": "200::text/plain",
            "tests": {
              "contractTests": [
                { "statusCode": { "enabled": true } }
              ]
            }
          },
          {
            "name": "wildcardContentTypes",
            "openApiRequest": "*/*",
            "openApiResponse": "200::*",
            "tests": {
              "contractTests": [
                { "statusCode": { "enabled": true } }
              ]
            }
          },
          {
            "name": "errorResponse",
            "openApiRequest": "application/json",
            "openApiResponse": "400",
            "overwrites": [
              {
                "overwriteRequestBody": [
                  { "key": "input", "value": "", "overwrite": true }
                ]
              }
            ],
            "tests": {
              "contractTests": [
                {
                  "statusCode": { "enabled": true },
                  "jsonBody": { "enabled": true },
                  "schemaValidation": { "enabled": true }
                }
              ]
            }
          }
        ]
      }
    ]
  },
  "globals": {
    "stripResponseExamples": true
  }
}
```

### Variations explained

- **jsonRequestJsonResponse** - Specific `openApiRequest` and `openApiResponse`
  for the JSON content type.
- **xmlRequestXmlResponse** - Variation targeting XML request and response.
- **textRequestTextResponse** - Variation for `text/plain` request and response.
- **wildcardContentTypes** - Uses wildcards for both request and response
  content types.
- **errorResponse** - Expects a `400` response by overwriting the request body to
  trigger an error.

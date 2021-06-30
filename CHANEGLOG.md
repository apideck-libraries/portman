## v1.1.0 - (2021-06-30)

### Operation Selectors

- new `openApiOperationsIds` setting can be passed as an array to selector operations for Portman to act on.

### CLI

- Added the option to upload a generated local postman collection and skip the Portman conversion

## v1.0.6 - (2021-06-30)

### CLI

- Added the option to load an existing postman collection and skip the openAPI to postman conversion

## v1.0.5 - (2021-06-29)

### Dependencies

- Added prompts package

## v1.0.4 - (2021-06-29)

### Dependencies

- move dev dependencies in package.json

## v1.0.3 - (2021-06-29)

### Dependencies

- updated postman-collection and others

## v1.0.2 - (2021-06-21)

### Bug Fixes

- contentTests that check against variables should use collectionVariables instead of environment variables

### Variation Tests

- nested folders (including variation tests) will be ignored when performing orderOfOperations
- Added statusCode tests for variations based on the openApiResponse property

## v1.0.1 - (2021-06-18)

### Overwrites

- extend overwrites to allow injection of objects and not just primitive values

## v1.0.0 - (2021-06-18)

## First Release

- Major overhaul from base release
- All features listed below

Added:

- [x] Convert an OpenAPI document to a Postman collection
  - [x] Support for OpenAPI 3.0
- Extend the Postman collection with capabilities
  - [x] Assign collection variables
    - [x] from ENV file
    - [x] from response body properties
    - [x] from response header properties
    - [x] from request body properties
  - [x] Inject Postman contract tests with
    - [x] HTTP response code validation
    - [x] Response time validation
    - [x] Response content-type validation
    - [x] Response JSON body validation
    - [x] Response JSON schema validation
    - [x] Response content validation
    - [x] Custom Postman tests
  - [x] Inject Postman variation tests for
    - [x] HTTP response code validation
    - [x] Response time validation
    - [x] Response content-type validation
    - [x] Response JSON body validation
    - [x] Response JSON schema validation
    - [x] Response content validation
    - [x] Custom Postman tests
  - [x] Inject Postman with
    - [x] Pre-request scripts on a collection level
  - [x] Modify Postman requests by
    - [x] Overwriting request path variables
    - [x] Overwriting request query params
    - [x] Overwriting request headers
    - [x] Overwriting request body
    - [x] Replace keywords with custom defined keys
    - [x] Replace values with custom defined values
    - [x] Search & replace any key/value with a specific value
    - [x] Order the collections requests
- [x] Upload the Postman collection to your Postman app
- [x] Test the Postman collection through Newman
- [x] Manage everything in config file for easy local or CI/CD usage

## v0.1.0 - (2021-05-31)

### OpenApi-Format / CLI options

- Added CLI Option filterFile to pass path to filter options for ignoring requests in spec before passing to Postman conversion

## v0.0.9 - (2021-05-28)

### CLI options

- Added CLI Option `envFile` to pass a path to `.env` that Portman should use for variable injection

## v0.0.8 - (2021-05-28)

### Newman

- Set Newman option to ignore redirects

## v0.0.7 - (2021-05-25)

### OpenApi-to-postman

- Corrected the incorrect "checkRequestBody" variable definition to "checkResponseBody"
- Let testsuite overwriteRequests handle the disabling of params

## v0.0.6 - (2021-05-25)

### CLI options

- Resolve issue with overriding paths to defaults when not provided
- Extended hardcoded list of params to disable until they are passed in as config

## v0.0.5 - (2021-05-25)

### OpenApi-to-postman

- Bumped openapi-to-postman to the latest version, which includes extended assignPmVariables test capabilities
- Added examples for the test suite assignPmVariables function
- Added examples for the test suite overwriteRequests function

## v0.0.4 - (2021-05-18)

### OpenApi-to-postman

- Bumped openapi-to-postman to version 2.7.0, which includes ContentCheck test capabilities
- Added examples for the test suite generation
- Added examples for the test suite contentChecks function
- Made the "orderOfOperations" property optional

### CLI options

- Adds the CLI option to configure the Portman CLI in a JSON file
- Adds the CLI option to configure output location of the Postman file
- Adds the CLI option to toggle upload to Postman

### Portman enhancements

- Adds the Portman option to sort Postman requests based on the "orderOfOperations" configuration
- Extends the Postman integration to upsert a collection based on the collection name

## v0.0.3 - (2021-05-06)

- Adds CLI options to pass in path to config files allowing multiple CIs to live in the same repo.

## v0.0.2 - (2021-05-06)

- Updates repo url to public repo

## v0.0.1 - (2021-05-06)

- Base release

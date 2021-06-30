# Portman 👨🏽‍🚀

Port OpenAPI Spec to Postman Collection, with contract & variation tests included!

Portman leverages OpenAPI documents, with all its defined API request/response properties, to power your Postman collection.
Let Portman do all the work and inject contract & variation tests with a minimum of configuration.
Customize the Postman requests & variables with a wide range of options to assign & overwrite variables.

## Why use Portman?

Convert your OpenAPI spec to Postman, generate contract & variation tests, upload the Postman collection & run the tests through Newman.
Include the Portman CLI as part of an automated process for injecting the power of Portman directly into your CI/CD pipeline.

## Features

With Portman, you can:

- [x] Convert an OpenAPI document to a Postman collection
  - [x] Support for OpenAPI 3.0
  - [ ] Support for OpenAPI 3.1
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
    - [ ] Pre-request scripts on a request level
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

## Getting started

1. Install Portman
2. Initialize Portman CLI configuration through the command: `$ portman --init`

OR

1. Install Portman
2. Copy `.env.example` to `.env` and add environment variables you need available to your collection.
3. Copy/rename and customize each of the \_\_\_\_.default.json config files in the root directory to suit your needs.
4. Start converting your OpenAPI document to Postman

All configuration options to convert from OpenAPI to Postman can be on the [openapi-to-postman](https://github.com/postmanlabs/openapi-to-postman/blob/develop/OPTIONS.md) package documentation.

## Installation

### Local Installation (recommended)

You can add the Portman CLI to the `node_modules` by using:

```shell
$ npm install --save @apideck/portman
```

or using yarn...

```shell
$ yarn add @apideck/portman
```

Note that this will require you to run the Portman CLI with `npx @apideck/portman -l your-openapi-file.yaml` or, if
you are using an older version of npm, `./node_modules/.bin/Portman -l your-openapi-file.yaml`.

### Global Installation

```shell
$ npm install -g @apideck/portman
```

### NPX usage

To execute the CLI without installing it via npm, use the npx method.

```shell
$ npx @apideck/portman -l your-openapi-file.yaml
```

## CLI Usage

```
Usage: -u <url> -l <local> -b <baseUrl> -t <includeTests>

Options:
      --help                 Show help                                                    [boolean]
      --version              Show version number                                          [boolean]
  -u, --url                  URL of OAS to port to Postman collection                     [string]
  -l, --local                Use local OAS to port to Postman collection                  [string]
  -b, --baseUrl              Override spec baseUrl to use in Postman                      [string]
  -o, --output               Write the Postman collection to an output file               [string]
  -n, --runNewman            Run Newman on newly created collection                       [boolean]
  -d, --newmanIterationData  Iteration data to run Newman with newly created collection   [string]
  --localPostman             Use local Postman collection, skips OpenAPI conversion       [string]
  --syncPostman              Upload generated collection to Postman (default: false)      [boolean]
  -p, --postmanUid           Collection UID to upload with generated Postman collection   [string]
  -t, --includeTests         Inject Portman test suite (default: true)                    [boolean]
  -c, --portmanConfigFile    Path to Portman settings config file (portman-config.json)   [string]
  -s, --postmanConfigFile    Path to openapi-to-postman config file (postman-config.json) [string]
  -s, --filterFile           Path to openapi-format config file (oas-format-filter.json)  [string]
  --envFile                  Path to the .env file to inject environment variables        [string]
  --cliConfigFile            Path to Portman CLI options file                             [string]
  --init                     Configure Portman CLI options in an interactive manner       [string]
```

### Environment variables as Postman variables

Portman uses `dotenv` to not only access variables for functionality, but you can easily add environment variables that you'd like declared within your Postman environment.
Simply prefix any variable name with `PORTMAN_`, and it will be available for use in your Postman collection as the camel-cased equivalent. For example:

```
PORTMAN_CONSUMER_ID=test_user_id
```

will be available in your collection or tests by referencing:

```
{{consumerId}}
```

It is possible to set a spec-specific `.env` file, that lives next to your config files. The path can be passed in via `envFile` cli option.
This is useful if you have Portman managing multiple specs that have unique environment requirements.

By default, Portman will leverage any ENVIRONMENT variable that is defined that starts with `PORTMAN_`.

### CLI Options

- Initialize Portman CLI configuration:

```
portman --init
```

The `init` option will help you to configure the cliConfig options and put the default config, env file in place to kick-start the usage of Portman.

- Pass in the remotely hosted spec:

```
portman -u https://specs.apideck.com/crm.yml
```

- Overwrite the baseUrl in spec and run Newman.

```
portman -u https://specs.apideck.com/crm.yml -b http://localhost:3050 -n true
```

- Path pass to a local data file for Newman to use for iterations.

```
portman -u https://specs.apideck.com/crm.yml -b http://localhost:3050 -n true -d ./tmp/newman/data/crm.json
```

- Pass the path to a local spec (useful when updating your specs) and output Postman collection locally

```
portman -l ./tmp/specs/crm.yml -o ./tmp/specs/crm.Postman.json
```

- Skip tests and just generate collection.

```
portman -l ./tmp/specs/crm.yml -t false
```

- Upload newly generated collection to Postman, which will upsert the collection, based on the collection name

```
portman -l ./tmp/specs/crm.yml --syncPostman true
```

Upload newly generated collection to Postman using the collection ID to overwrite the existing.

```
portman -l ./tmp/specs/crm.yml --syncPostman true -p 9601963a-53ff-4aaa-92a0-2e70a8a2a748
```

- Pass custom paths for config files

All configuration options to convert from OpenAPI to Postman can be on the [openapi-to-postman](https://github.com/postmanlabs/openapi-to-postman/blob/develop/OPTIONS.md) package documentation.
Portman provides a default openapi-to-postman configuration [postman-config.default.json](postman-config.default.json), which will be used if no custom config `--postmanConfigFile` is passed.

```
portman -u https://specs.apideck.com/crm.yml -c ./tmp/crm/portman-config.json -s ./common/postman-config.json
```

- Pass all CLI options as JSON file

All the CLI options can be managed in a separate configuration file and passed along to the portman command. This will
make configuration easier, especially in CI/CD implementations.

```
portman --cliOptionsFile ./examples/cli-options/portman-cli-options.json
```

All the available Portman CLI options can be used in the config file.
By passing the CLI options as parameter, you can overwrite the defined CLI options defined in the file.

For more details, review the [cli-options example](https://github.com/apideck-libraries/portman/tree/main/examples/cli-options).

### Output

Without specifying the output location, your generated Postman Collection is written to `./tmp/converted/${specName}.json` if you are manually importing to Postman or need to inspect for debugging.

By using `-o` or `--output` parameter, you can define the location where the Postman collection will be written.

```
portman -l ./tmp/specs/crm.yml -o ./tmp/specs/crm.Postman.json
```

### To Note:

Newman is set to ignore redirects to allow for testing redirect response codes. If you are running collections within Postman UI, you'll need to ensure Postman is set to the same, or your redirect tests will fail.

Postman > Preferences > Automatically follow redirects > OFF

## Portman settings

The Portman settings consist out of multiple parts:

- **version** : which refers to the JSON Portman configuration version.
- **tests** : which refers to the definitions for the generated contract & variance tests.
  - **contractTests** : refers to the options to enabled autogenerated contract tests.
  - **contentTests** : refers to the additional Postman tests that check the content.
  - **variationTests** : refers to the options to define variation tests.
  - **extendTests** : refers to the custom additions of manually created Postman tests.
- **assignVariables** : which refers to setting Postman collection variables for easier automation.
- **overwrites** : which refers to the custom additions/modifications of the OpenAPI/Postman request data.
- **globals** : which refers to the customization that applies for the whole Postman collection.

### Portman targeting

It is possible to inject Postman tests and pre-register scripts, assign variables and overwrite query params, headers, request body data with values.

To be able to do this very specifically, there are options to define the targets:

- **openApiOperationId (String)** : References to the OpenAPI operationId, example: `leadsAll`
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : References to a combination of the OpenAPI method & path, example: `GET::/crm/leads`

- **excludeForOperations (Array)** : References to OpenAPI operations that will be skipped for targeting. It supports both the `openApiOperationId` and `openApiOperation` format, example: `["leadsAdd", "GET::/crm/leads/{id}"]`

An `openApiOperationId` is an optional property. To offer support for OpenAPI documents that don't have operationIds, we
have added the `openApiOperation` definition, which is the unique combination of the OpenAPI method & path, with a `::`
separator symbol. The targeting option `excludeForOperations` is really useful when using wildcards, to allow exclusions from the wildcard.

This will allow targeting for very specific OpenAPI items.

To facilitate managing the filtering, we have included wildcard options for the `openApiOperation` option, supporting
the methods & path definitions.

REMARK: Be sure to put quotes around the target definition.

- **Strict matching** example: `"openApiOperation": "GET::/crm/leads",`
  This will target only the "GET" method and the specific path "/pets"

- **Method wildcard matching** example: `"openApiOperation": "*::/crm/leads",`
  This will target all methods ('get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace') and the specific
  path "/pets"

- **Path wildcard matching** example: `"openApiOperation": "GET::/crm/*"`
  This will target only the "GET" method and any path matching any folder behind the "/pets", like "/pets/123" and
  "/pets/123/buy".

- **Method & Path wildcard matching** example: `"openApiOperation": "*::/crm/*",`
  A combination of wildcards for the method and path parts is even possible.

### Portman - `tests` properties

The Portman `tests` is where you would define the tests that would be applicable and automatically generated by Portman, based on the OpenAPI document.
The contract tests are grouped in an array of `contractTests`.

#### contractTests options

- **openApiOperationId (String)** : References to the OpenAPI operationId. (example: `leadsAll`)
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : References to a combination of the OpenAPI method & path (example: `GET::/crm/leads`)
- **excludeForOperations (Array | optional)** : References to OpenAPI operations that will be skipped for targeting, example: `["leadsAdd", "GET::/crm/leads/{id}"]`

- **statusSuccess (Boolean)** : Adds the test if the response of the Postman request returned a 2xx
- **statusCode (Boolean, HTTP code)** : Adds the test if the response of the Postman request return a specific status code.
- **responseTime (Boolean)** : Adds the test to verify if the response of the Postman request is returned within a number of ms.
- **contentType (Boolean)** : Adds the test if the response header is matching the expected content-type defined in the OpenAPI spec.
- **jsonBody (Boolean)** : Adds the test if the response body is matching the expected content-type defined in the OpenAPI spec.
- **schemaValidation (Boolean)** : Adds the test if the response body is matching the JSON schema defined in the OpenAPI spec. The JSON schema is inserted inline in the Postman test.
- **headersPresent (Boolean)** : Adds the test to verify if the Postman response header has the header names present, like defined in the OpenAPI spec.

For more details, review the [contract-tests example](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-contract-tests).

#### variationTests options

- **openApiOperationId (String)** : References to the OpenAPI operationId for which a variation will be created. (example: `leadsAll`)
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : References to a combination of the OpenAPI method & path for which a variation will be created. (example: `GET::/crm/leads`)
- **excludeForOperations (Array | optional)** : References to OpenAPI operations that will be skipped for targeting, example: `["leadsAdd", "GET::/crm/leads/{id}"]`

- **tests** : which refers to the definitions for the generated contract & variance tests for the variation.
  - **contractTests** : refers to the options to enabled autogenerated contract tests for the variation.
  - **contentTests** : refers to the additional Postman tests that check the content for the variation.
  - **extendTests** : refers to the custom additions of manual created Postman tests to be included in the variation.
- **assignVariables** : This refers to setting Postman collection variables that are assigned based on variation.
- **overwrites** : which refers to the custom additions/modifications of the OpenAPI/Postman request data, specifically for the variation.

For more details, review the [content-variation example](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-variation-tests).

### Portman - `contentTests` properties

Content tests will validate if the response property values will match the expected defined values.
While the Portman `tests` verify the "contract" of the API, the `contentTests` will verify the content of the API.

#### contentTests options

- **openApiOperationId (String)** : References to the OpenAPI operationId. (example: `leadsAll`)
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : References to a combination of the OpenAPI method & path (example: `GET::/crm/leads`)
- **excludeForOperations (Array | optional)** : References to OpenAPI operations that will be skipped for targeting, example: `["leadsAdd", "GET::/crm/leads/{id}"]`

- **responseBodyTests (Array)** : Array of key/value pairs of properties & values in the Postman response body.
  - **key (String)** : The key that will be targeted in the response body to check if it exists.
  - **value (String)** : The value that will be used to check if the value in the response body matches.

For more details, review the [content-tests example](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-content-tests).

### Portman - `extendTests` properties

When you need to add additional tests or overwrite the Portman-generated test, you can use the `extendTests` to define the raw Postman tests.
Anything added in the `tests` array will be added to the Postman test scripts.

#### extendTests options

- **openApiOperationId (String)** : References to the OpenAPI operationId. (example: `leadsAll`)
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : References to a combination of the OpenAPI method & path (example: `GET::/crm/leads`)
- **excludeForOperations (Array | optional)** : References to OpenAPI operations that will be skipped for targeting, example: `["leadsAdd", "GET::/crm/leads/{id}"]`

- **tests (Array)** : Array of additional Postman test scripts.
- **overwrite (Boolean true/false | Default: false)** : Resets all generateTests and overwrites them with the defined tests from
  the `tests` array.
- **append (Boolean true/false | Default: true)** : Place the tests after (append) or before (prepend) all generated tests.

<hr>

### Portman - `assignVariables` properties

The "assignVariables" allows you to set Postman collection variables for easier automation.

#### assignVariables options

- **openApiOperationId (String)** : Reference to the OpenAPI operationId for which the Postman pm.collectionVariables will be set. (example: `leadsAll`)
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, for which the Postman pm.collectionVariables will be set. example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : Reference to the combination of the OpenAPI method & path, for which the Postman pm.collectionVariables will be set. (example: `GET::/crm/leads`)
- **excludeForOperations (Array | optional)** : References to OpenAPI operations that will be skipped for targeting, example: `["leadsAdd", "GET::/crm/leads/{id}"]`

- **collectionVariables (Array)** : Array of key/value pairs to set the Postman collection variables.
  - **responseBodyProp (String)** : The property for which the value will be taken from the response body and set the value as the pm.collectionVariables value.
  - **responseHeaderProp (String)** : The property for which the value will be taken from the response header and set the value as the pm.collectionVariables value.
  - **requestBodyProp (String)** : The property for which the value will be taken from the request body and set the value as the pm.collectionVariables value.
  - **value (String)** : The defined value that will be set as the pm.collectionVariables value.
  - **name (string OPTIONAL | Default: openApiOperationId.responseProp)** : The name that will be used to overwrite the default generated variable name

For more details, review the [assign-variables example](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-assign-variables).

<hr>

### Portman - `overwrites` properties

To facilitate automation, you might want to modify properties with "randomized" or specific values. The overwrites are mapped based on the OpenAPI operationId or OpenAPI Operation reference.

#### overwrites options

- **openApiOperationId (String)** : Reference to the OpenAPI operationId for which the Postman request will be overwritten or extended. (example: `leadsAll`)
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, for which the Postman request will be overwritten or extended example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : Reference to combination of the OpenAPI method & path, for which the Postman request will be overwritten or extended (example: `GET::/crm/leads`)
- **excludeForOperations (Array | optional)** : References to OpenAPI operations that will be skipped for targeting, example: `["leadsAdd", "GET::/crm/leads/{id}"]`

- **overwriteRequestQueryParams (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Query params.

  - **key (String)** : The key that will be targeted in the request Query Param to overwrite/extend.
  - **value (String)** : The value that will be used to overwrite/extend the value in the request Query Param OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request query param value OR attach the value to the original request query param value.
  - **disable (Boolean true/false | Default: false)** : Disables the request query param in Postman
  - **remove (Boolean true/false | Default: false)** : Removes the request query param

- **overwriteRequestPathVariables (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Path Variables.

  - **key (String)** : The key that will be targeted in the request Path variables to overwrite/extend.
  - **value (String)** : The value that will be used to overwrite/extend the value in the request path variable OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request path variable value OR attaches the value to the original request Path variable value.
  - **remove (Boolean true/false | Default: false)** : Removes the request path variable

- **overwriteRequestHeaders (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Headers.

  - **key (String)** : The key that will be targeted in the request Headers to overwrite/extend.
  - **value (String)** : The value that will be used to overwrite/extend the value in the request headers OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request header value OR attaches the value to the original request header value.
  - **remove (Boolean true/false | Default: false)** : Removes the request headers

- **overwriteRequestBody (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Body.

  - **key (String)** : The key that will be targeted in the request body to overwrite/extend.
  - **value (String)** : The value that will be used to overwrite/extend the key in the request body OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request body value OR attaches the value to the original request body value.
  - **remove (Boolean true/false | Default: false)** : Removes the request body property, including the value.

For more details, review the [overwrites example](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-overwrites).

<hr>

### Portman - `globals` property

The configuration defined in the `globals` will be executed on the full Postman collection. This is handy if you need to do mass replacements of variables or specific words/keys/values in the full collection that cannot be overwritten per request.

#### globals options

- **collectionPreRequestScripts** : Array of scripts that will be injected as Postman Collection Pre-request Scripts that will execute before every request in this collection.
- **keyValueReplacements** : A map of parameter key names that will have their values replaced with the provided Postman variables.
- **valueReplacements** : A map of values that will have their values replaced with the provided values.
- **rawReplacements** : Consider this a "search & replace" utility, that will search a string/object/... and replace it with another string/object/...
  This is very useful to replace data from the OpenAPI specification to be used in the Postman test automation.
- **orderOfOperations** : The `orderOfOperations` is a list of OpenAPI operations, which is used by Portman to sort the Postman requests in the desired order, in their folder. Items that are **not** defined in the `orderOfOperations` list will remain at their current order.

For more details, review the [globals example](https://github.com/apideck-libraries/portman/tree/main/examples/portman-globals) and [ordering example](https://github.com/apideck-libraries/portman/tree/main/examples/postman-ordering)

## Configure automatic upload to Postman App

To enable automatic uploads of the generated Postman collection through Portman, follow these simple steps:

1. Get your Postman API key

![Documentation Pipeline](https://raw.githubusercontent.com/apideck-libraries/portman/main/docs/img/postman-automation-0.png)

![Documentation Pipeline](https://raw.githubusercontent.com/apideck-libraries/portman/main/docs/img/postman-automation-1.png)

![Documentation Pipeline](https://raw.githubusercontent.com/apideck-libraries/portman/main/docs/img/postman-automation-2.png)

2. Goto the root folder of your project

3. Copy `./env-postman-app-example` as `.env` in the root folder of

4. Enter your Postman API key in your local `.env`

It is recommended to put a separate `.env` file lives in the root of your project to hold your `POSTMAN_API_KEY`.
Do not commit this `.env` in any version systems like GIT since it contains credentials.

# Credits

Portman started as a PR on the handy [openapi-to-postman](https://github.com/postmanlabs/openapi-to-postman) package to generate basic Postman tests from the OpenAPI specification.

[Apideck](https://www.apideck.com/) immediately saw the PR's value and collaborated with the original author, [Tim Haselaars](https://github.com/thim81), to adopt the functionality and extend the options & tooling to create "Portman".

The goal of Portman is to drive API automation by 'porting' a static OpenAPI document to a dynamic Postman collection that includes a powerful testing suite with variable requests, bodies and more. All this while being easy to configure & ready to use.

Portman is a valuable tool in any OpenAPI workflow, for local development or as part of a CI/CD automation pipeline.

Credits for this package for the hard work of [Nick Lloyd](https://github.com/nicklloyd) and [Tim Haselaars](https://github.com/thim81).

# Future ideas

- [ ] add task to initialize config files
- [ ] add interactive cli prompts
- [ ] render better error on Postman upload fail
- [ ] cache the Postman collection lookup during Postman upload

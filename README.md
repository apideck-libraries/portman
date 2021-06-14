# Portman 👨🏽‍🚀

Port OpenAPI Spec to Postman Collection!

Portman sits on top of [@thim81](https://github.com/thim81)'s [open PR](https://github.com/thim81/openapi-to-Postman). Tim has made awesome progress in converting an OAS to a Postman Collection with automated test injection. At [Apideck](https://apideck.com), we wanted to include this as part of an automated process that could be injecting directly into our CI/CD pipeline.

## Features

With Portman, we can:
- [x] Convert an OpenApi document to Postman collection
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
    - [x] Pre-Execution Scripts on a collection level
    - [x] Pre-Execution Scripts on a request level
  - [x] Modify Postman requests by
    - [x] Overwriting request path variables
    - [x] Overwriting request query params
    - [x] Overwriting request headers
    - [x] Overwriting request body
    - [x] Replace keywords with custom defined keys
    - [x] Replace values with custom defined values
    - [x] Order the collections requests
- [x] Upload the Postman collection to your Postman app
- [x] Run the Postman collection though Newman
- [x] Manage everything in config file for easy local or CI/CD usage

## Getting started

1. Install Portman 
2. Copy `.env.example` to `.env` and add environment variables you need available to your collection.
3. Copy/rename and customize each of the \_\_\_\_.example.json config files in the root directory to suit your needs.
4. Start converting your OpenApi document to Postman
- Postman Configuration options can be found [here](https://github.com/thim81/openapi-to-Postman/blob/develop/OPTIONS.md)
- Configuring test generation can be found [here](https://github.com/thim81/openapi-to-Postman/blob/develop/TESTGENERATION.md)

## Installation

### Local Installation (recommended)

You can add the Portman CLI to the `node_modules` by using:

```shell
$ npm install --save-dev @apideck/portman
```

or using yarn...

```shell
$ yarn add -D @apideck/portman
```

Note that this will require you to run the openapi-format CLI with `npx openapi-format your-openapi-file.yaml` or, if
you are using an older versions of npm, `./node_modules/.bin/openapi-format your-openapi-file.yaml`.

### Global Installation

```shell
$ npm install -g @apideck/portman
```

### NPX usage

To execute the CLI without installing it via npm, use the npx method

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
  -b, --baseUrl              Override spec baseUrl to use in test suite                   [string]
  -o, --output               Write the Postman collection to an output file               [string]
  -n, --runNewman            Run newman on newly created collection                       [boolean]
  -d, --newmanIterationData  Iteration data to run newman with newly created collection   [string]
  --syncPostman              Upload generated collection to Postman (default: false)      [boolean]
  -p, --PostmanUid           Collection UID to upload&overwrite with generated collection [string]
  -t, --includeTests         Inject test suite (default: true)                            [boolean]
  -c, --portmanConfigFile    Path to portman-config.json                                  [string]
  -s, --PostmanConfigFile    Path to Postman-config.json                                  [string]
  --envFile                  Path to the .env file to inject environment variables        [string]
  --cliConfigFile            Path to the file with the Portman CLI options                [string]
```

### Environment variables

Portman uses `dotenv` to not only access variables for functionality, but you can easily add environment variables that you'd like declared within your Postman environment.
Simply prefix any variable name with `PORTMAN_`, and it will be available for use in your Postman collection as the camelcased equivalent. For example:

```
PORTMAN_CONSUMER_ID=test_user_id
```

will be available in your collection or tests by referencing:

```
{{consumerId}}
```

#### Recommended

A separate `.env` file lives in the root of your project to hold your `Postman_API_KEY`, but a spec specific `.env` file can live next to your config files, and the path passed in via `envFile` cli option.
This is useful if you have Portman managing multiple specs that have unique environment requirements.

### CLI Configuration

To generate the collection with tests, define a JSON file like the example (portman-config.json) below and run the CLI with the --generate option.

```
{
  "preRequestScripts": [
    "pm.collectionVariables.set('statusId', '12345')"
  ],
  "variableOverwrites": {
    "x-apideck-app-id": "{{applicationId}}"
  }
}
```

- **preRequestScripts**: Array of scripts that will be injected as Postman Pre-request Scripts that will execute before every request in this collection.
- **variableOverwrites**: A map of parameter key names that will have their values replaced with the provided Postman variables.

### CLI Options

- Pass in the remote hosted spec:

```
yarn portman -u https://specs.apideck.com/crm.yml
```

- Overwrite the baseUrl in spec and run newman.

```
yarn portman -u https://specs.apideck.com/crm.yml -b http://localhost:3050 -n true
```

- Path pass to local data file for newman to use for iterations.

```
yarn portman -u https://specs.apideck.com/crm.yml -b http://localhost:3050 -n true -d ./tmp/newman/data/crm.json
```

- Pass path to a local spec (useful when updating your specs) and output Postman collection locally

```
yarn portman -l ./tmp/specs/crm.yml -o ./tmp/specs/crm.Postman.json
```

- Skip tests and just generate collection.

```
yarn portman -l ./tmp/specs/crm.yml -t false
```

- Upload newly generated collection to Postman which will upsert the collection, based on the collection name

```
yarn portman -l ./tmp/specs/crm.yml --syncPostman true
```

Upload newly generated collection to Postman using the collection ID to overwrite the existing.

```
yarn portman -l ./tmp/specs/crm.yml --syncPostman true -p 9601963a-53ff-4aaa-92a0-2e70a8a2a748
```

- Pass custom paths for config files

```
yarn portman -u https://specs.apideck.com/crm.yml -c ./tmp/crm/portman-config.json -g ./tmp/crm/Postman-testsuite.json  -s ./common/Postman-config.json
```

- Pass all CLI options as JSON file

All the CLI options can be managed in a separate configuration file and passed along to the portman command. This will
make configuration easier, especially in CI/CD implementations.

```
yarn portman --cliOptionsFile ./examples/cli-options/portman-cli-options.json
```

All the available Portman CLI options can be used in the config file.
By passing the CLI options as parameter, you can overwrite the defined CLI options defined in the file.

### Output

Without specifying the output location, your generated Postman Collection is written to `./tmp/converted/${specName}.json` if you are manually importing to Postman or need to inspect for debugging.

By using `-o` or `--output` parameter, you can define the location where the Postman collection will be written.

```
yarn portman -l ./tmp/specs/crm.yml -o ./tmp/specs/crm.Postman.json
```

### To Note:

Newman is set to ignoreRedirects to allow for testing redirect response codes. If you are running collections within Postman UI, you'll need to ensure Postman is set to the same or your redirect tests will fail.

Postman > Preferences > Automatically follow redirects > OFF

## Portman settings

The Portman settings consists out of x parts:

- **version** : which refers the JSON Portman configuration version (not relevant but might handy for future backward compatibility options).
- **tests** : which refers the default available generated contract tests. The default tests are grouped per type (response, request)
- **contentTests**:  which refers the additional Postman tests that check the content.
- **extendTests**:  which refers the custom additions of manual created Postman tests.
- **assignVariables**:  which refers to setting Postman collection variables for easier automation.
- **overwrites**:  which refers to the custom additions/modifications of the OpenApi/Postman request data. 
- **globals**:  which refers to the customisation that apply for the whole Postman collection. 

### Portman targeting

It is possible to inject Postman tests and pre-register scripts, assign variables and overwrite query params, headers, request body data with values.

To be able to do this very specifically, there are options to define the targets:

- **openApiOperationId (String)** : References to the OpenApi operationId, example: `leadsAll`
- **openApiOperation (String)** :  References to a combination of the OpenApi method & path, example: `GET::/crm/leads`

An `openApiOperationId` is an optional property. To offer support for OpenApi documents that don't have operationIds, we
have added the `openApiOperation` definition which is the unique combination of the OpenApi method & path, with a `::`
separator symbol.

This will allow targeting for very specific OpenApi items.

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
A combination of wildcards for the method and path parts are even possible.

### Portman - `tests` properties

The Portman `tests` is where you would define the "contract" tests that would be applicable and automatically generated by Portman, based on the OpenApi document.
The contract tests are grouped in an array of `responseTests`.

#### responseTests options:
- **openApiOperationId (String)** : References to the OpenApi operationId. (example: `leadsAll`)
- **openApiOperation (String)** :  References to a combination of the OpenApi method & path (example: `GET::/crm/leads`)
- **statusSuccess (boolean)**: Adds the test if the response of the Postman request return a 2xx
- **responseTime (boolean)**: Adds the test if the response of the Postman request is within a number of ms.
- **contentType (boolean)**: Adds the test if the response header is matching the expected content-type defined in the OpenApi spec.
- **jsonBody (boolean)**: Adds the test if the response body is matching the expected content-type defined in the OpenApi spec.
- **schemaValidation (boolean)**: Adds the test if the response body is matching the JSON schema defined in the OpenApi spec. The JSON schema is inserted inline in the Postman test.
- **headersPresent (boolean)**: Adds the check if the Postman response header has the header names present, like defined in the OpenApi spec.

### Portman - `contentTests` properties

Content tests will validate, if the response property values will match the expected defined values.
While the Portman `tests` verify the "contract" of the API, the `contentTests` will verify the content of the API.

#### responseBodyTest options:
- **openApiOperationId (String)** : References to the OpenApi operationId. (example: `leadsAll`)
- **openApiOperation (String)** :  References to a combination of the OpenApi method & path (example: `GET::/crm/leads`)
- **responseBodyTest (Array)** : Array of key/value pairs of properties & values in the Postman response body.
  - **key (string)** : The key that will be targeted in the response body to check if it exists.
  - **value (string)** : The value that will be used to check if the value in the response body matches.
  
### Portman - `extendTests` properties

When you need to add additional tests or overwrite the Portman generated test, you can use the `extendTests` to define the raw Postman tests.
Anything added in `tests` array, will be added to the Postman test scripts.

#### extendTests options:
- **openApiOperationId (String)** : References to the OpenApi operationId. (example: `leadsAll`)
- **openApiOperation (String)** :  References to a combination of the OpenApi method & path (example: `GET::/crm/leads`)
- **tests (Array)** : Array of additional Postman test scripts.
- **overwrite (Boolean true/false)** : Resets all generateTests and overwrites them with the defined tests from
  the `tests` array. Default: false
- **append (Boolean true/false)** : Place the tests after (append) or before (prepend) all generated tests. Default: true

<hr>

### Portman - `assignVariables` properties

The "assignVariables" allows you to set Postman collection variables for easier automation.
For all the details and an example, see [](TODO) 

#### assignVariables options:

- **openApiOperationId (String)** : Reference to the OpenApi operationId for which the Postman pm.collectionVariables
  will be set. (example: `leadsAll`)
- **openApiOperation (String)** : Reference to the combination of the OpenApi method & path, for which the Postman
  pm.collectionVariables will be set. (example: `GET::/crm/leads`)
- **collectionVariables (Array)** : Array of key/value pairs to set the Postman collection variables.
  - **responseBodyProp (string)** : The property for which the value will be taken in the response body and set the value as the pm.collectionVariables value.
  - **responseHeaderProp (string)** : The property for which the value will be taken in the response header and set the value as the pm.collectionVariables value.
  - **requestBodyProp (string)** : The property for which the value will be taken in the request body and set the value as the pm.collectionVariables value.
  - **value (string)** : The defined value that will be set as the pm.collectionVariables value.
  - **name (string OPTIONAL | Default: openApiOperationId.responseProp** : The name that will be used to overwrite the default generated variable name

<hr>

### Portman - `overwrites` properties

To facilitate automation, you might want to modify property values with "randomized" or specific values. The overwrites are mapped based on the OpenApi operationId or OpenApi Operation reference.
For all the details and an example, see [](TODO)

#### overwrites options:
- **openApiOperationId (String)** : Reference to the OpenApi operationId for which the Postman request body will be extended. (example: `leadsAll`)
- **openApiOperation (String)** : Reference to combination of the OpenApi method & path, for which the Postman request body will be extended (example: `GET::/crm/leads`)

- **overwriteRequestQueryParams (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Query params.

  - **key (string)** : The key that will be targeted in the request Query Param to overwrite/extend.
  - **value (string)** : The value that will be used to overwrite/extend the value in the request Query Param OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request query param value OR attach the value to the original request query param value.
  - **disable (Boolean true/false | Default: false)** : Disables the request query param in Postman
  - **remove (Boolean true/false | Default: false)** : Removes the request query param

- **overwriteRequestPathVariables (Array)** :
  Array of key/value pairs to overwrite in the Postman Request Path Variables.

  - **key (string)** : The key that will be targeted in the request Path variables to overwrite/extend.
  - **value (string)** : The value that will be used to overwrite/extend the value in the request path variable OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request path variable value OR attach the value to the original request Path variable value.
  - **remove (Boolean true/false | Default: false)** : Removes the request path variable

- **overwriteRequestHeaders (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Headers.

  - **key (string)** : The key that will be targeted in the request Headers to overwrite/extend.
  - **value (string)** : The value that will be used to overwrite/extend the value in the request headers OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request header value OR attach the value to the original request header value.
  - **remove (Boolean true/false | Default: false)** : Removes the request headers

- **overwriteRequestBody (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Body.

  - **key (string)** : The key that will be targeted in the request body to overwrite/extend.
  - **value (string)** : The value that will be used to overwrite/extend the key in the request body OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request body value OR attach the value to the original request body value.
  - **remove (Boolean true/false | Default: false)** : Removes the request body property, including the value.

### Portman - `globals` property

The configuration defined in the `globals` will be executed on the full Postman collection. This is handy if you need to do mass replacements of variables or specific word/keys/values in the full collection.

#### collectionPreRequestScripts options:

This contains the "pre-request script" that will be added to Postman on collection level and executed before each request.

#### variableOverwrites options:

The "variableOverwrites" allow you to overwrite all matching keys with a variable definition.

#### globalReplacements options:

Consider this a "search & replace" utility, that will search a string/object/... and replace it with another string/object/...
This is very useful to replace data from the OpenApi specification to be used in the Postman test automation. 

## Configure automatic upload to Postman App

1. Get your Postman API key

![Documentation Pipeline](../docs/img/Postman-automation-0.png)

![Documentation Pipeline](../docs/img/Postman-automation-1.png)

![Documentation Pipeline](../docs/img/Postman-automation-2.png)

2. Goto the root folder `TODO`

3. Copy `./env-Postman-example` as `.env-Postman` TODO

3. Enter you Postman API key in your local `.env-Postman`

### TODO:

- [ ] add task to initalize config files
- [ ] add interactive cli prompts
- [ ] render better error on Postman upload fail
- [ ] cache the Postman collection lookup during Postman upload 

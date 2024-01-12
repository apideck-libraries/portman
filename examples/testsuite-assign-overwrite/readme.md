# OpenAPI Postman test suite generation - assignVariables & overwriteRequestQueryParams example

This example focuses on assigning Postman variables based on the response of an API request, with the goal to be able to reuse them in other requests with as minimal configuration as possible.
The difference is that we will be using template expressions to set the Postman variables and while overwriting the request values.
We will not be using any contract tests in this example, to keep the example as simple as possible.

_use-cases_:

- Generate Postman flows that require values from previous operations

- Reference a created entity to be used in Read/Update/Delete flows by setting the ID reference as query parameter

## CLI usage

```ssh
portman --cliOptionsFile ./examples/testsuite-assign-overwrite/portman-cli-options.json
```

Configured by using the portman-cli config.

This is an example where we take the OpenAPI defined in `crm.yml`, with only 2 entities (leads & contacts) and convert to Postman, with Postman variables set from response that can be used when execution Postman requests.

## Portman settings

The portman settings (in JSON format) consists out of multiple parts.
In this example we focus on the **assignVariables**  and **overwrites** sections, using a configuration in YAML format.

file: examples/testsuite-assign-overwrite/portman-config.crm.yaml

## Portman - "assignVariables" properties

Version 1.0

To facilitate automation, we provide the option to set Postman collection variables with values from the response. The assigning of the "pm.collectionVariables" are mapped based on the OpenAPI operationId or OpenAPI Operation reference.

### Target options:

- **openApiOperationId (String)** : Reference to the OpenAPI operationId for which the Postman pm.collectionVariables variable
  will be set. (example: `listPets`)
- **openApiOperation (String)** : Reference to the combination of the OpenAPI method & path, for which the Postman
  pm.collectionVariables will be set. (example: `GET::/pets`)

These target options are both supported for defining a target. In case both are set for the same target, only the `openApiOperationId` will be used for overwrites.

### collectionVariables options:

- **collectionVariables (Array)** :

  Array of key/value pairs to set the Postman collection variables.

  - **responseBodyProp (String)** : The property for which the value will be taken in the response body and set the value as the pm.collectionVariables value.
  - **responseHeaderProp (String)** : The property for which the value will be taken in the response header and set the value as the pm.collectionVariables value.
  - **requestBodyProp (String)** : The property for which the value will be taken in the request body and set the value as the pm.collectionVariables value.
  - **value (String)** : The defined value that will be set as the pm.collectionVariables value.
  - **name (string OPTIONAL |  Default: <operationId>.<varProp>)** : The desired name that will be used to as the Postman variable name. If the `name` is not provided, Portman will generate a variable name, using the `<operationId>.<varProp>`. You can pass your own template expressions, to dynamically generate variable names. The template can contain the following dynamic expressions: `<operationId>` results in the OpenAPI operation ID (example `leadsAdd`), `<path>` results in the OpenAPI operation ID (example `/crm/leads`), `<pathRef>` results in the Portman operation (example `POST::/crm/leads_POST`), `<method>` results in the OpenAPI method (example `GET`), `<opsRef>` results in the OpenAPI `operationId` with a fallback to the `pathRef` in case the OpenAPI does not contain an operation ID. For the full list of dynamic expressions, check the [Assign & Overwrite example](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-assign-overwrite#template-expressions).

## Portman - "overwrites" properties

Version 1.0

To facilitate automation, you might want to modify property values with "randomized" or specific values. The overwrites are mapped based on the OpenAPI operationId or OpenAPI Operation reference.

### Target options:

- **openApiOperationId (String)** : Reference to the OpenAPI operationId for which the Postman request body will be extended. (example: `leadsAll`)
- **openApiOperation (String)** : Reference to combination of the OpenAPI method & path, for which the Postman request body will be extended (example: `GET::/crm/leads`)

These target options are both supported for defining a target. In case both are set for the same target, only the `openApiOperationId` will be used for overwrites. See below for more options on targeting.

### Overwrite options:

- **overwriteRequestQueryParams (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Query params.

  - **key (String)** : The key that will be targeted in the request Query Param to overwrite/extend.
  - **value (Any)** : The value that will be used to overwrite/extend the value in the request Query Param OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`. The value can be a text/number/boolean/array/object or Postman variable (to pass the Postman variable as type boolean or number, use `{{{variableName}}}` surrounded by 3x {{{ and 3x }}}). Supports also templating to generate variable names.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request query param value OR attach the value to the original request query param value.
  - **disable (Boolean true/false | Default: false)** : Disables the request query param in Postman.
  - **remove (Boolean true/false | Default: false)** : Removes the targeted request query param from Postman.
  - **insert (Boolean true/false | Default: true)** : Insert additional the request query param in Postman that are not present in OpenAPI.

- **overwriteRequestPathVariables (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Path Variables.

  - **key (String)** : The key that will be targeted in the request Path variables to overwrite/extend.
  - **value (String)** : The value that will be used to overwrite/extend the value in the request path variable OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.  Supports also templating to generate variable names.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request path variable value OR attach the value to the original request Path variable value.
  - **remove (Boolean true/false | Default: false)** : Removes the targeted request path variable from Postman.
  - **insert (Boolean true/false | Default: true)** : Insert additional the request path variable in Postman that are not present in OpenAPI.
  - **description (String)** : Optional, Overwrites the request path variable description in Postman.

- **overwriteRequestHeaders (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Headers.

  - **key (String)** : The key that will be targeted in the request headers to overwrite/extend.
  - **value (String)** : The value that will be used to overwrite/extend the value in the request headers OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.  Supports also templating to generate variable names.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request header value OR attach the value to the original request header value.
  - **disable (Boolean true/false | Default: false)** : Disables the request headers param in Postman.
  - **remove (Boolean true/false | Default: false)** : Removes the targeted request headers from Postman.
  - **insert (Boolean true/false | Default: true)** : Insert additional the request headers in Postman that are not present in OpenAPI.

- **overwriteRequestBody (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Body.

  - **key (String)** : The key that will be targeted in the request body to overwrite/extend.
  - **value (String)** : The value that will be used to overwrite/extend the key in the request body OR use the [Postman Dynamic variables](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.  Supports also templating to generate variable names.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request body value OR attach the value to the original request body value.
  - **remove (Boolean true/false | Default: false)** : Removes the request body property, including the value.

## Example explained

In this example, we are zooming in on only the assignVariables usage and overwrite usage. 

file: examples/testsuite-assign-overwrite/portman-config.crm.json >>

```yaml
globals:
  stripResponseExamples: true
  variableCasing: snakeCase
assignVariables:
  - openApiOperation: POST::*
    collectionVariables:
      - responseBodyProp: data.id
        name: "<tag>Id"
overwrites:
  - openApiOperation: "*::/crm/*/{id}"
    excludeForOperations:
      - POST::*
    overwriteRequestPathVariables:
      - key: id
        value: "{{<tag>Id}}"
        overwrite: true
```

### globals

```yaml
globals:
  stripResponseExamples: true
  variableCasing: snakeCase
```

The `globals` section is used to set global settings for the conversion. In this case we set the `stripResponseExamples` to `true` to strip the response examples from the Postman collection. This is useful to keep the Postman collection as clean as possible.
The `variableCasing` is set to `snakeCase` to convert the Postman variable names to snake_case. This is useful to keep the Postman variables as consistent as possible.

The following variable casing options are supported:

- `camelCase` : Convert the Postman variable names to camelCase
- `snakeCase` : Convert the Postman variable names to snake_case
- `pascalCase` : Convert the Postman variable names to PascalCase
- `kebabCase` : Convert the Postman variable names to kebab-case
- `trainCase` : Convert the Postman variable names to Train-Case
- `adaCase` : Convert the Postman variable names to Ada_Case
- `constantCase` : Convert the Postman variable names to CONSTANT_CASE
- `cobolCase` : Convert the Postman variable names to COBOL-CASE
- `dotNotation` : Convert the Postman variable names to dot.notation

### assignVariables from responseBodyProp

```yaml
assignVariables:
  - openApiOperation: POST::*
    collectionVariables:
      - responseBodyProp: data.id
        name: "<tag>Id"
```

This will target all POST responses and where it will take the value of the  `data.id` property from the response body, and set that safe that as a Postman collection variable.
The name of the variable is dynamically build by using a the Portman template expressions. In this case we use the `<tag>` template expression, which will be replaced with the tag name of the OpenAPI operation.

The API response of the create operation will contain:

```json
{
  "status_code": 200,
  "status": "OK",
  "service": "zoho-crm",
  "resource": "companies",
  "operation": "one",
  "data": {
    "id": "12345"
  }
}
```

After the conversion, in the "leadsAdd" request (POST::/crm/leads) in the Postman app, you can find the following result in the test tab.

file: examples/testsuite-assign-overwrite/crm.postman.json >>

Postman request "Leads" >> "Create lead" Test tab:

```js
// Set response object as internal variable
let jsonData = {};
try {jsonData = pm.response.json();}catch(e){}

// Set property value as variable
const _resDataId = jsonData?.data?.id;

// pm.collectionVariables - Set leads_id as variable for jsonData.data.id
if (_resDataId !== undefined) {
  pm.collectionVariables.set("leads_id", jsonData.data.id);
  // console.log("- use {{leads_id}} as collection variable for value",jsonData.data.id);
} else {
  console.log('INFO - Unable to assign variable {{leads_id}}, as jsonData.data.id is undefined.');
};
```

Each time the request is executed in Postman, the `{{$leads_id}}` variables will be updated with the `data.id` from the API response.
This allows you to capture the ID of the newly created entity.

For easier usage, the Postman variable name is shown in the console log of Portman & Postman.

## Template expressions

The template expressions are used to dynamically build the Postman variable name. The template expressions are defined between `<` and `>`.

Let's take an OpenAPI operation `leadsAll` as example, to explain the template expressions.

```yaml
path:
  /crm/leads:
  get:
    tags:
      - Leads
      - CRM
    operationId: leadsAll
    summary: List leads
```

The following template expressions are supported:

- `<operationId>` : The operationId of the OpenAPI operation. Example: `leadsAll`
- `<method>` : The method of the OpenAPI operation. Example: `GET`
- `<path>` : The path of the OpenAPI operation. Example: `/crm/leads`
- `<pathRef>` : The Portman path reference of the OpenAPI operation. Example: `GET::/crm/leads`
- `<opsRef>` : The Portman reference of the OpenAPI operation, results in the OpenAPI `operationId` with a fallback to the `pathRef` in case the OpenAPI does not contain an operation ID.
- `<tag>` : The tag name of the OpenAPI operation. If multiple tags are defined, the first tag will be used. Example: `Leads`
- `<tag1>` : The first tag name of the OpenAPI operation. Example: `Leads`
- `<tag2>` : The second tag name of the OpenAPI operation, if there are more than 1 tag defined. Example: `CRM`
- `<tagn>` : The nth tag name of the OpenAPI operation, if there are more than 1 tag defined.
- `<pathPart1>` : The first part of the path of the OpenAPI operation. Example: `crm`
- `<pathPart2>` : The second part of the path of the OpenAPI operation. Example: `leads`
- `<pathPartn>` : The nth part of the path of the OpenAPI operation.


## assignVariables with usage in overwriteRequestQueryParams

In combination with the `overwrites` option, you can then chain the Creation operation with the Read/Update/Delete operations. 
You can use the same template expressions to target the Postman variables.

```yaml
overwrites:
  - openApiOperation: "*::/crm/*/{id}"
    excludeForOperations:
      - POST::*
    overwriteRequestQueryParams:
      - key: id
        value: "{{<tag>Id}}"
        overwrite: true
```

This will target all ( GET/PUT/PATCH/DELETE) methods that contain the path `/crm/*/{id}`  and will overwrite the request query param `id` with the value of the Postman variable, using the `<tag>Id` template expression.
The `excludeForOperations` is used to exclude the overwrite for the POST operations, as the POST operation does not contain the `id` query param.

The handy thing is that you can use the same template expression to target the Postman variable, as you used to assign the Postman variable.
So no need to configure Portman to overwrite with specific Postman variables per operation, as you can use the same template expression to assign the Postman variable.

This will allow you to keep the configuration as minimal as possible.

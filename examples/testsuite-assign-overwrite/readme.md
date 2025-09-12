# OpenAPI Postman test suite generation - assignVariables & overwriteRequestQueryParams example

In the [assignVariables example](../testsuite-assign-variables/readme.md) we used the **overwrites** directive to set a request path parameter to Postman collection variables that had been set to a value based on the response body of a previous request.

In this example, we will dive more deeply into some of the syntax of using the **overwrites** directive, including how to use Template Expressions when determining which Postman variable to update or use for an assignment.

At the end of this Readme, we'll also include an example explaining how to overwrite request body attributes using both Postman collection variables and Template Expresssions.

_use-cases_:

- Generate Postman flows that require values from previous operations

- Reference a created entity to be used in Read/Update/Delete flows by setting the ID reference as query parameter

## Try this example yourself using the portman CLI
You can run this example yourself by downloading the following two files:
- [Download Sample CRM API Spec](./crm.openapi.yml)
- [Download Overwrite Example Config](./portman-config.crm.yml)

This example assumes you are running portman from the same directory that you download these file to, and have [installed portman locally](../../README.md#local-installation-recommended) and are running the command from the top level directory in your project. If you [installed portman globally](../../README.md#global-installation) remove the `npx` from the beginning of the command.  

The example command ignores any existing portman configuration you may have setup, but if you are familiar with portman configuration you can include other parameters, for example those to automatically push the collection to Postman.



```ssh
npx portman -l ./crm.openapi.yml  -c ./portman-config.crm.yml
```

In this example we take the OpenAPI defined in `crm.yml`, with only 2 entities (leads & contacts) and convert to Postman, with Postman variables set from response that can be used when execution Postman requests.

We will not be using any contract tests in this example, to keep the example as simple as possible.   

## Portman settings

The portman settings (in YAML format) consists out of multiple parts.
In this example we focus on the **assignVariables**  and **overwrites** sections, using a configuration in YAML format.

file: examples/testsuite-assign-overwrite/portman-config.crm.yaml

## Portman - "assignVariables" properties

Version 1.0

To facilitate automation, we provide the option to set Postman collection variables with values from the response. The assigning of the "pm.collectionVariables" are mapped based on the OpenAPI operationId or OpenAPI Operation reference.

### Target options:

Specify the types of requests which should generate tests that will assign Postman Environment variables:

- **openApiOperationId (String)** : Reference to the OpenAPI operationId for which the Postman pm.collectionVariables variable
  will be set. (example: `contactsAll`)
- **openApiOperation (String)** : Reference to the combination of the OpenAPI method & path, for which the Postman
  pm.collectionVariables will be set. (example: `GET::/crm/contacts`)

These target options are both supported for defining a target. In case both are set for the same target, only the `openApiOperationId` will be used for overwrites.

### collectionVariables options:

Specify the names of the Postman environment variables which should be set, and the values they should be set to.

- **collectionVariables (Array)** :

  Array of key/value pairs to set the Postman collection variables.   Each entry will include:

  - **name (string OPTIONAL |  Default: <operationId>.<varProp>)** : The name of the Postman environment variable to be set. 
    - This can be a static string with the name of the variable.
    - You may instead use a template expression to dynamically generate variable names. For the full list of dynamic expressions, see [Template Expressions](#template-expressions).
    - If the `name` is not provided, Portman will generate a variable name, using the Template Expression: `<operationId>.<varProp>`.

  - The value for the environment variable is specified by using one of:
    - **responseBodyProp (String)** : The response body property whose value the environment variable will be set to.
    - **responseHeaderProp (String)** : The response header whose value the environment variable will be set to.
    - **requestBodyProp (String)** : The request body property whose value the environment variable will be set to.
    - **value (String)** : A static defined value that the environment variable will be set to.

## Portman - "overwrites" properties

Version 1.0

To facilitate automation, you might want to modify property values with "randomized" or specific values. The overwrites are mapped based on the OpenAPI operationId or OpenAPI Operation reference.

### Target options:

Specify the types of requests which should have elements of the default request overwritten:

- **openApiOperationId (String)** : Reference to the OpenAPI operationId for which the Postman request body will be extended. (example: `leadsAll`)
- **openApiOperation (String)** : Reference to combination of the OpenAPI method & path, for which the Postman request body will be extended (example: `GET::/crm/leads`)

These target options are both supported for defining a target. In case both are set for the same target, only the `openApiOperationId` will be used for overwrites. See below for more options on targeting.

### Overwrite options:

Specify the aspects of the request to be overwritten, and the values they should be set to.

- **overwriteRequestPathVariables (Array)** :

  Array of key/value pairs to overwrite in the Postman Request Path Variables.

  - **key (String)** : The key that will be targeted in the request Path variables to overwrite/extend.
  - **value (String)** : The value that specified Path variable should be set to. May be:
  will be used to overwrite/extend the value in the request path variable OR 
    - a [Postman Dynamic Variable](https://learning.Postman.com/docs/writing-scripts/script-references/variables-list/), such as `{{$guid}}` or `{{{$randomInt}}}`.  
    - a Postman Environment variable name specified using [Template Expressions](#template-expressions), such as '{{\<tag>Id}}'.
    - a static string variable such as "foobar"
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the default request path variable as specified in examples defined in the OpenAPI specification, OR if no example was provided, attach the value to the original request Path variable value.  
  - **remove (Boolean true/false | Default: false)** : Removes the targeted request path variable from Postman.
  - **insert (Boolean true/false | Default: true)** : Insert additional the request path variable in Postman that are not present in OpenAPI.
  - **description (String)** : Optional, Overwrites the request path variable description in Postman.

The "overwriteRequestQueryParams", "overwriteRequestBody", "overwriteRequestHeaders", see the [Portman readme](https://github.com/apideck-libraries/portman) or the [Overwrite Request Body example](#overwriterequestbody-syntax) for more details.

## Example explained

In this example, we are zooming in on only the assignVariables usage and overwrite usage. 

file: examples/testsuite-assign-overwrite/portman-config.crm.json >>

```yaml
globals:
  stripResponseExamples: true
  variableCasing: snakeCase
assignVariables:
  # After creating a new object, save it's ID in a postman env. var
  - openApiOperation: POST::*
    collectionVariables:
      - responseBodyProp: data.id
        name: "<tag>Id"
overwrites:
  # Set the ID of the object to fetch based on the ID from the previous POST
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

This will target all POST requests, and will generate scripts that will take the value of the  `data.id` property from the response body, and set that to the appropriate Postman collection variable.
The name of the variable is dynamically build by using a the Portman [Template Expressions](#template-expressions). In this case we use the `<tag>` template expression, which will be replaced with the tag name of the OpenAPI operation.

For example, the API response to a `POST /crm/leads` request will contain:

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

After Portman generates the test collection, in the "leadsAdd" request (POST::/crm/leads) in the Postman app, you can find the following result in the test or scripts tab:

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

Note that the collection variable "leads_id" was dynamically generated first by evaluating the Template Expression: `\<tag>Id`, and then using the `variableCasing` style "snakeCase".

Each time the `POST /crm/leads` request is executed in Postman, the `{{$leads_id}}` variables will be updated with the `data.id` from the API response.

This allows you to capture the ID of the newly created entity.

Similarly when a `POST /crm/contacts` request is executed, a variable "contacts_id" is set.

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

In combination with the `overwrites` option, you can then chain the creation operation with the read/update/delete operations. 
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

This targets all (GET/PUT/PATCH/DELETE) methods that contain the path `/crm/*/{id}`  and overwrites the request query parameter `id` with the value of the Postman variable, using the `<tag>Id` template expression.
The `excludeForOperations` is used to exclude the overwrite for the POST operations, as the POST operation does not contain the `id` query parameter.

The handy thing is that you can use the same template expression syntax you used to assign a value to the Postman variable in the `assignVariables` section, when using the `overwrites` to overwrite someting in the request based on the the value of a dynamically evaluated Postman variable.  

With template expressions you can configure Portman to overwrite different requests with different Postman variables per operation using a single set of directives.  This will allow you to keep the configuration as minimal as possible.

## overwriteRequestBody syntax

The `overwrites` directive can also be used to overwrite properties in a request body to strings, numbers, booleans and arrays using static values or Postman collection variables.

Here is a somewhat nonsensical example that demonstrate the syntax.  Certain postman collection variables are assumed to exist for the purposes of this example:   

```yaml
    overwrites:
    - openApiOperation: "PUT::/xxxtypes/{id}"
      - overwriteRequestBody:
          - key: stringAttribute
            value: '{{postmanStringVar}}'
            overwrite: true
          - key: numberAttribute
            value: '{{{postmanIntVar}}}'
            overwrite: true
          - key: booleanAttribute
            value: '{{{postmanBoolVar}}}'
            overwrite: false
          - key: arrayAttribute
            value: '{{{postmanArrayVar}}}'
            overwrite: true
          - key: anotherStringAttribute
            value: <tag>.<operationId>

```

In this example we specify that when making a PUT request to a hypothetical "xxxtypes" endpoint we will overwrite some of the properties in the request body with the value in hypothetical Postman collection variables.

`overwriteRequestBody` takes an array of objects that describe the properties in the request body to overwritten.  The properties for each object are:
- **key** - Required.  The name of the property in the request body to ovewrite.
- **value** - Required. The new value to assign.  May be:
  - a static string
  - a static number
  - a static array
  - a static boolean (ie: `true` or `false`)
  - a reference to a postman collection variable.  
    - If encapsulated by 2 curly braces the value of the variable will be enclosed in double quote (ie: treated like a string).
    - If encapsulated by 3 curly braces the value of the variabled will not be enclosed in quotes and will be interpreted as a number, boolean, or array as appropriate.
    - Note that the braces **must** be enclosed by single or double quotes.
  - A [Template Expression](#template-expressions), or combination of Template Expressions
- **overwrite** - Optional.   If set to true the value specified will be used in the Request Body, even if the spec includes an example value.  This is the default behavior if `overwrite` is not specified.   If set to `false` the specified `value` will only be used if there is no example specified in the spec.

For a more concrete example see the [operationPreRequestScripts example](../testsuite-pre-request-scripts/readme.md).


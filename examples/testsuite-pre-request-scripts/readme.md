# OpenAPI Postman test suite generation - operationPreRequestScripts & overwriteRequestBody example

In the [assignVariables and overwrite example](../testsuite-assign-overwrite/readme.md#overwriterequestbody-syntax) we showed a somewhat nonsensical example of overwriting a request body to demonstrate the syntax required when using a postman collection variable as the value for a string, number, boolean or array value in a request body.

In this example, we'll demonstrate how to use Portman to generate a Postman pre-request script to modify a numeric Postman collection variable in order to use it as a numeric value in the request body of a susquent PATCH request.

_use-cases_:

- Generate Postman flows that require values from previous operations

- Reference and modify the created entity before using it in a subsequent Update flow

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

We will not explicitly define any contract tests in this example, to keep the example as simple as possible.   

## Portman settings

The portman settings (in YAML format) consists out of multiple parts.
In this example we focus on the **operationPreRequestScripts**  and **overwrites** sections, using a configuration in YAML format.

file: examples/testsuite-pre-request-scripts/portman-config.crm.yaml

## Portman - "operationPreRequestScripts" properties

Version 1.0

To facilitate automation, we provide the option to inject a Pre-Request script into the generated collection.   This can be useful if, for example, there is a desire to modify the value of a Postman collection variable prior to making the request

### Target options:

Specify the types of requests which should contain the specified Pre-Request Scripts:

- **openApiOperationId (String)** : Reference to the OpenAPI operationId on which the "Pre-request Scripts" will be inserted. (example: `leadsAll`)
- **openApiOperationIds (Array)** : References to an array of OpenAPI operationIds, for which the "Pre-request Scripts" will be inserted (example: `['leadsAll', 'companiesAll', 'contactsAll']`
- **openApiOperation (String)** : Reference to combination of the OpenAPI method & path, for which the "Pre-request Scripts" will be inserted (example: `GET::/crm/leads`)
- **excludeForOperations (Array | optional)** : References to OpenAPI operations that will be skipped for targeting. (example: `["leadsAdd", "GET::/crm/leads/{id}"]`)


### scripts options:

An Array of scripts that will be injected as Postman Pre-request Scripts on request level, that will be executed before the targeted requests in this collection. Values can be:

- raw javascript content that has been stringified using a tool such as [JSON Stringify Online](https://jsonformatter.org/json-stringify-online), eg:
- the path to a file containing the script to insert, eg:
    

Example:
```yaml
operationPreRequestScripts:
  - openApiOperation: "*::/*"
    scripts:
      - "// Example pre-request script\nconsole.log(\"This was written by a pre-request script\")"
      - file:./scripts/a_pre_request_script.js
```

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

- **overwriteRequestBody (Array)** :

    An array of objects that define how certain request body properties should be modified:
    - **key** - Required.  The name of the property in the request body to ovewrite.
    - **value** - Required. The new value to assign.  May be:
      - a static string
      - a static number
      - a static array
      - a static boolean as a string (ie: "true" or "false")
      - a postman collection variable.  
        - If encapsulated by 2 curly braces the value of the variable will be enclosed in double quote (ie: treated like a string).
        - If encapsulated by 3 curly braces the value of the variabled will not be enclosed in quotes and will be interpreted as a number, boolean, or array as appropriate.
        - Note that the braces **must** be enclosed by single or double quotes.
      - A [Template Expression](../testsuite-assign-overwrite/readme.md#template-expressions), or combination of Template Expressions
    - **overwrite** - Optional.   If set to true the value specified will be used in the Request Body, even if the spec includes an example value.  This is the default behavior if `overwrite` is not specified.   If set to `false` the specified `value` will only be used if there is no example specified in the spec.

The `overwrites` directive also supports "overwriteRequestQueryParams", "overwriteRequestPathParams", and "overwriteRequestHeaders", see the [Portman readme](https://github.com/apideck-libraries/portman) or the [Overwrite Request Path Variables example](../testsuite-assign-overwrite/readme.md#overwrite-options) for more details.

## Example explained

In this example, we are zooming in on only the `assignVariables`, `operationPreRequestScripts` and `overwrite` usage. 

file: examples/testsuite-pre-request-scripts/portman-config.crm.json >>

```yaml
assignVariables:
  # After getting a lead object, save it's monetary_amount in a postman collection variable
  - openApiOperation: GET::/crm/leads/{id}
    collectionVariables:
      - responseBodyProp: data.monetary_amount
        name: "<tag>_monetary_amount"

operationPreRequestScripts:
  # Before updating a lead using the postman variable, update
  # it's value in a pre-request script
  - openApiOperation: "PATCH::/crm/leads/{id}"
    scripts:
      - file:increaseMonetaryAmount.js

overwrites:
  # When updating a lead use the Monetary Amount environment variable
  - openApiOperation: "PATCH::/crm/leads/{id}"
    overwriteRequestBody:
      - key: monetary_amount
        value: '{{{<tag>_monetary_amount}}}'
        overwrite: true
```

### assignVariables from responseBodyProp

```yaml
assignVariables:
  # After getting a lead object, save it's monetary_amount in a postman collection variable
  - openApiOperation: GET::/crm/leads/{id}
    collectionVariables:
      - responseBodyProp: data.monetary_amount
        name: "<tag>_monetary_amount"
```

This will target a GET request to the /crm/leads/{id} endpoint, and will generate scripts that will take the value of the  `data.monetary_amount` property from the response body, and set that to the appropriate Postman collection variable.
The name of the variable is dynamically built by using a Portman [Template Expression](../testsuite-assign-overwrite/readme.md#template-expressions). In this case we use the `<tag>` template expression, which will be replaced with the tag name of the OpenAPI operation.

For example, the API response to a `GET /crm/leads{id}` request will contain:

```json
{
  "status_code": 200,
  "status": "OK",
  "service": "zoho-crm",
  "resource": "companies",
  "operation": "one",
  "data": {
    "id": "12345",
    "name": "Elon Musk",
    "company_name": "Spacex",
    "owner_id": "54321",
    "company_id": "2",
    "lead_id": "2",
    "lead_source": "Cold Call",
    "first_name": "Elon",
    "last_name": "Musk",
    "description": "A thinker",
    "prefix": "Sir",
    "title": "CEO",
    "language": "EN",
    "status": "New",
    "monetary_amount": 75000,
    "currency": "USD",
    "fax": "+12129876543",
    "websites": [
      {
        "id": "12345",
        "url": "http://example.com",
        "type": "primary"
      }
    ],
    "addresses": [
      {
        "id": "123",
        "type": "primary",
        "string": "25 Spring Street, Blackburn, VIC 3130",
        "name": "HQ US",
        "line1": "Main street",
        "line2": "apt #",
        "line3": "Suite #",
        "line4": "delivery instructions",
        "street_number": "25",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94104",
        "country": "US",
        "latitude": "40.759211",
        "longitude": "-73.984638",
        "county": "Santa Clara",
        "contact_name": "Elon Musk",
        "salutation": "Mr",
        "phone_number": "111-111-1111",
        "fax": "122-111-1111",
        "email": "elon@musk.com",
        "website": "https://elonmusk.com",
        "notes": "Address notes or delivery instructions.",
        "row_version": "1-12345"
      }
    ],
    "social_links": [
      {
        "id": "12345",
        "url": "https://www.twitter.com/apideck",
        "type": "twitter"
      }
    ],
    "phone_numbers": [
      {
        "id": "12345",
        "country_code": "1",
        "area_code": "323",
        "number": "111-111-1111",
        "extension": "105",
        "type": "primary"
      }
    ],
    "emails": [
      {
        "id": "123",
        "email": "elon@musk.com",
        "type": "primary"
      }
    ],
    "custom_fields": [
      {
        "id": "2389328923893298",
        "name": "employee_level",
        "description": "Employee Level",
        "value": "Uses Salesforce and Marketo"
      }
    ],
    "tags": [
      "New"
    ],
    "custom_mappings": {},
    "updated_at": "2020-09-30T07:43:32.000Z",
    "created_at": "2020-09-30T07:43:32.000Z"
  }
}
```

After Portman generates the test collection, in the "leadsOne" request `GET::/crm/leads/{id}` in the Postman app, you can find the following result in the test or scripts tab:

file: examples/testsuite-pre-request-scripts/crm.postman.json >>

Postman request "Leads" >> "Get lead" Scripts tab:

```js
// Set response object as internal variable
let jsonData = {};
try {jsonData = pm.response.json();}catch(e){}

// Set property value as variable
const _resDataMonetaryAmount = jsonData?.data?.monetary_amount;

// pm.collectionVariables - Set Leads_monetary_amount as variable for jsonData.data.monetary_amount
if (_resDataMonetaryAmount !== undefined) {
   pm.collectionVariables.set("Leads_monetary_amount", jsonData.data.monetary_amount);
   console.log("- use {{Leads_monetary_amount}} as collection variable for value",jsonData.data.monetary_amount);
} else {
   console.log('INFO - Unable to assign variable {{Leads_monetary_amount}}, as jsonData.data.monetary_amount is undefined.');
};
```

Note that the collection variable "Leads_monetary_amount" was dynamically generated first by evaluating the Template Expression: `\<tag>_monetary_amount`.  Since no `variableCasing` style was specified this converted exactly to `Leads_monetary_amount`.

Each time a `GET /crm/leads/{id}` request is executed in the generated Postman collection , the `{{Leads_monetary_amount}}` variable will be updated with the `data.monetary_amount` from the API response.

This allows us to capture the initial value of the monetary_amount field of the recently queried entity.

For easier usage, the Postman variable name is shown in the console log of Portman & Postman.

## operationPreRequestScript example
In our example we imagine a scenario where we want to test updating a contact when we learn that a lead's monetary value has increased.    To make this change we inject a pre-request script that will increase the previously saved value.

```yaml
operationPreRequestScripts:
  # Before updating a lead using the postman variable, update
  # it's value in a pre-request script
  - openApiOperation: "PATCH::/crm/leads/{id}"
    scripts:
      - file:increaseMonetaryAmount.js
```

This targets the call to PATCH /crm/leads/{id}, and instructs portman to inject the script in the file [increaseMonetaryAmount](./increaseMonetaryAmount.js) as a Pre-Request script that will be run prior to making the API request.

The content of the script is:
```js
// Pre-request script to check the existing monetary_amount of the lead and then double it
let monetaryAmount = pm.collectionVariables.get("Leads_monetary_amount")
if (monetaryAmount > 0) {
    monetaryAmount *= 2;
} else {
    monetaryAmount = 25000;
}
// Update the environment variable with the new amount prior to updating the lead
pm.collectionVariables.set("Leads_monetary_amount", monetaryAmount);
```

This script fetches the previously saved collection variable `Leads_monetary_amount`.  If it has a value greater than zero the amount is doubled, otherwise it is set to 25,000.

After the script runs the new value of the variable will be used in any request that references it.

## overwrites with overwriteRequestBody

Now that we have saved the initial `monetary_amount` of an existing lead, and run a script to increase it's value, we want to use the new value in the body of a PATCH request to update that lead.

```yaml
overwrites:
  # When updating a lead use the Monetary Amount environment variable
  - openApiOperation: "PATCH::/crm/leads/{id}"
    overwriteRequestBody:
      - key: monetary_amount
        value: '{{{<tag>_monetary_amount}}}'
        overwrite: true
```

This also targets the call to PATCH /crm/leads/{id}, and instructs portman to overwrite any default value for the `monetary_amount` property in the request body with the new value that has been saved to the `Leads_monetary_amount` postman collection variable.

Here again we use the <tag> template expression which could allow us to use the same instructions for other endpoints that have a "monetary_amount" property in their schema.

The generated request body for this request will now include this property:

```json
  "monetary_amount": {{Leads_monetary_amount}},
```

It's worth noting that since the schema defines the `monetary_amount` property as a number, we enclosed the postman collection variable name with three curly braces instead of two.   This instructs portman to omit quotes around the value in the generated request body JSON so that the value is treated as a number rather than a string.

In general three curly braces should be used when overwriting a request body property that is a number, boolean, or an array.   Two curly braces should be used for properties with string values.   In both cases the collection variable and the braces must be enclosed with single or double quotes in the postman configuration.  This is described in more detail in the [overwriteRequestBody syntax discussion in the assign-overwrites example](../testsuite-assign-overwrite/readme.md#overwriterequestbody-syntax)


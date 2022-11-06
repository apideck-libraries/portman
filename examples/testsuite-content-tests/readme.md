# OpenAPI Postman test suite generation - Content Tests

In the "[examples/testsuite-contract-tests](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-contract-tests)" example, we explained the default generated Postman contract tests.

This example focuses on the extension of the contract test suite with specific content tests. While the contract tests focuses on the validation of the request/response properties, the "content tests" targets on validating the actual values of the API.

_use-case_: convert OpenAPI to Postman with a range of Postman tests automatically generated, extended by content tests, where we validate the response values.

## CLI usage

```ssh
portman --cliOptionsFile ./examples/testsuite-content-tests/portman-cli-options.json
```

Configured by using the portman-cli config.

This is an example where we take the OpenAPI defined in `crm.yml`, with only 1 entity (leads) to keep the example simple and convert to Postman with all the default contract tests generated out-of-the-box + a number of content tests.

## Portman settings

The portman settings (in JSON format) consists out of multiple parts, in this example we focus on the **contentTests** section and settings.

file: examples/testsuite-content-tests/portman-config.crm.json

```json
{
  "version": 1.0,
  "contentTests": [
    {
      "openApiOperationId": "leadsAll",
      "responseBodyTests": [
        {
          "key": "data[0].company_name",
          "value": "Spacex"
        },
        {
          "key": "data[0].name",
          "contains": "Musk"
        },
        {
          "key": "status_code",
          "oneOf": [200, 201]
        },
        {
          "key": "data[0].monetary_amount",
          "value": 75000
        },
        {
          "key": "data[0].description",
          "length": 9
        },
        {
          "key": "data",
          "minLength": 1
        },
        {
          "key": "data",
          "maxLength": 20
        },
        {
          "key": "resource",
          "value": "companies"
        }
      ]
    },
    {
      "openApiOperationId": "leadsOne",
      "responseBodyTests": [
        {
          "key": "data.websites[*].url",
          "value": "http://example.com"
        }
      ],
      "responseHeaderTests": [
        {
          "key": "Operation-Location",
          "contains": "/operations/",
          "length": 15
        }
      ]
    }
  ]
}
```

## Portman - "contentTests" properties

Version 1.0

Next to the generated tests, it is possible to define "content" tests where a property and the value of the response body should exist and match a specific value or variable.

The contentTests are mapped based on the OpenAPI operationId or the OpenAPI Operation reference (method + path).
Anything added in `responseBodyTests` array, will be added as content check to the Postman tests.

##### Target options:

- **openApiOperationId (String)** : Reference to the OpenAPI operationId for which the Postman Response body will be tested. (example: `leadsAll`)
- **openApiOperation (String)** : Reference to the combination of the OpenAPI method & path, for which the Postman Response body will be test (example: `GET::/leads`)

These target options are both supported for defining a target. In case both are set for the same target, only the `openApiOperationId` will be used for content tests.

##### Content check options:

- **responseBodyTests (Array)** : Array of key/value pairs of properties & values in the Postman response body.
- **key (String)** : The key that will be targeted in the response body to check if it exists. To look up a key within in array of objects, you can use an array index (example `data.websites[0].url`) or a * wildcard (example: `data.websites[*].url`) which uses the `value` to match an object in an array.  - **value (String)** : The value that will be used to check if the value in the response body property matches.
  - **contains (String)** : The value that will be used to check if the value is present in the value of the response body property.
  - **oneOf (String[],Number[],Boolean[])** : The value that will be used to check one of the values is matching the response body property.
  - **length (Number)** : The number that will be used to check if the value of the response body property (string/array) has a length of the defined number.
  - **minLength (Number)** : The number that will be used to check if the value of the response body property (string/array) has a minimum length of the defined number.
  - **maxLength (Number)** : The number that will be used to check if the value of the response body property (string/array) has a maximum length of the defined number.
  - **notExist (Boolean)** : The inverse of the key check that verify if the key does not exist in the response body.
  - **assert (String)** : A custom Postman assertion to check if the value in the response body property matches with the provided assertion (example: `not.to.be.null`).

- **responseHeaderTests (Array)** : Array of key/value pairs of properties & values in the Postman response header.
  - **key (String)** : The header name that will be targeted in the response header to check if it exists.
  - **value (String)** : The value that will be used to check if the value in the response header matches.
  - **contains (String)** : The value that will be used to check if the value is present in the value of the response header.
  - **oneOf (String[],Number[],Boolean[])** : The value that will be used to check one of the values is matching the value of the response header.
  - **length (Number)** : The number that will be used to check if the value of the response header has a length of the defined number of characters.
  - **minLength (Number)** : The number that will be used to check if the value of the response header has a minimum length of the defined number of characters.
  - **maxLength (Number)** : The number that will be used to check if the value of the response header has a maximum length of the defined number of characters.
  - **notExist (Boolean)** : The inverse of the key check that verify if the key does not exist in the response header.
  - **assert (String)** : A custom Postman assertion to check if the value in the response header matches with the provided assertion (example: `not.to.be.null`).

## Example explained

In this example, we are zooming in on only the content tests usage. For the basics on the testsuite configuration and usage in Portman, have a look at ["examples/testsuite-contract-tests"]("https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-contract-tests")

file: examples/testsuite-content-tests/portman-config.crm.json >>

```json
{
  "version": 1.0,
  "tests": {
    "contentTests": [
      {
        "openApiOperationId": "leadsAll",
        "responseBodyTests": [
          {
            "key": "data[0].company_name",
            "value": "Spacex"
          },
          {
            "key": "data[0].name",
            "contains": "Musk"
          },
          {
            "key": "status_code",
            "oneOf": [
              200,
              201
            ]
          },
          {
            "key": "data[0].monetary_amount",
            "value": 75000
          },
          {
            "key": "data[0].description",
            "length": 9
          },
          {
            "key": "data",
            "minLength": 1,
            "maxLength": 20
          },
          {
            "key": "resource",
            "value": "companies"
          },
          {
            "key": "@count",
            "notExist": true
          },
          {
            "key": "service",
            "assert": "not.to.be.undefined"
          }
        ]
      },
      {
        "openApiOperationId": "leadsOne",
        "responseBodyTests": [
          {
            "key": "data.websites[*].url",
            "value": "http://example.com"
          }
        ],
        "responseHeaderTests": [
          {
            "key": "Operation-Location",
            "value": "/operations/123",
            "contains": "/operations/",
            "length": 15,
            "minLength": 5,
            "maxLength": 20,
            "assert": "not.to.be.undefined"
          }
        ]
      }
    ]
  }
}
```

### responseBodyTests

After the conversion, in the "leadsAll" request (GET::/crm/leads) in the Postman app, you can find the specific tests in the "Tests" tab.

file: examples/testsuite-content-tests/crm.postman.json >>

Postman request "Leads" >> "List leads" API Response:

```json
{
  "status_code": 200,
  "status": "OK",
  "service": "zoho-crm",
  "resource": "companies",
  "operation": "one",
  "data": [
    {
      "id": "12345",
      "owner_id": "54321",
      "company_id": "2",
      "company_name": "Spacex",
      "contact_id": "2",
      "name": "Elon Musk",
      "first_name": "Elon",
      "last_name": "Musk",
      "description": "A thinker",
      "prefix": "Sir",
      "title": "CEO",
      "status": "New",
      "monetary_amount": 75000,
      "currency": "USD",
      "fax": "+12129876543",
      "updated_at": "2020-09-30T07:43:32.000Z",
      "created_at": "2020-09-30T07:43:32.000Z"
    }
  ],
  "meta": {
    "items_on_page": 50,
    "cursors": {
      "previous": "em9oby1jcm06OnBhZ2U6OjE=",
      "current": "em9oby1jcm06OnBhZ2U6OjI=",
      "next": "em9oby1jcm06OnBhZ2U6OjM="
    }
  },
  "links": {
    "previous": "https://unify.apideck.com/crm/companies?cursor=em9oby1jcm06OnBhZ2U6OjE%3D",
    "current": "https://unify.apideck.com/crm/companies",
    "next": "https://unify.apideck.com/crm/companies?cursor=em9oby1jcm06OnBhZ2U6OjM"
  }
}
```

Part of Postman Testsuite tests:

```javascript
// Set response object as internal variable
let jsonData = {};
try {jsonData = pm.response.json();}catch(e){}

// Response body should have "data[0].company_name"
pm.test("[GET]::/crm/leads - Content check if 'data[0].company_name' exists", function() {
  pm.expect((typeof jsonData.data[0].company_name !== "undefined")).to.be.true;
});

// Response body should have value "Spacex" for "data[0].company_name"
if (jsonData?.data?.[0]?.company_name) {
  pm.test("[GET]::/crm/leads - Content check if value for 'data[0].company_name' matches 'Spacex'", function() {
    pm.expect(jsonData.data[0].company_name).to.eql("Spacex");
  })};

// Response body should have "data[0].name"
pm.test("[GET]::/crm/leads - Content check if 'data[0].name' exists", function() {
  pm.expect((typeof jsonData.data[0].name !== "undefined")).to.be.true;
});

// Response body should contain value "Musk" for "data[0].name"
if (jsonData?.data?.[0]?.name) {
  pm.test("[GET]::/crm/leads - Content check if value for 'data[0].name' contains 'Musk'", function() {
    pm.expect(jsonData.data[0].name).to.include("Musk");
  })};

// Response body should have "status_code"
pm.test("[GET]::/crm/leads - Content check if 'status_code' exists", function() {
  pm.expect((typeof jsonData.status_code !== "undefined")).to.be.true;
});

// Response body should be one of the values "200,201" for "status_code"
if (jsonData?.status_code) {
  pm.test("[GET]::/crm/leads - Content check if value for 'status_code' is matching one of: '200,201'", function() {
    pm.expect(jsonData.status_code).to.be.oneOf([200,201]);
  })};

// Response body should have "data[0].monetary_amount"
pm.test("[GET]::/crm/leads - Content check if 'data[0].monetary_amount' exists", function() {
  pm.expect((typeof jsonData.data[0].monetary_amount !== "undefined")).to.be.true;
});

// Response body should have value "75000" for "data[0].monetary_amount"
if (jsonData?.data?.[0]?.monetary_amount) {
  pm.test("[GET]::/crm/leads - Content check if value for 'data[0].monetary_amount' matches '75000'", function() {
    pm.expect(jsonData.data[0].monetary_amount).to.eql(75000);
  })};

// Response body should have "data[0].description"
pm.test("[GET]::/crm/leads - Content check if 'data[0].description' exists", function() {
  pm.expect((typeof jsonData.data[0].description !== "undefined")).to.be.true;
});

// Response body should have a length of "9" for "data[0].description"
if (jsonData?.data?.[0]?.description) {
  pm.test("[GET]::/crm/leads - Content check if value of 'data[0].description' has a length of '9'", function() {
    pm.expect(jsonData.data[0].description.length).to.equal(9);
  })};

// Response body should have "data"
pm.test("[GET]::/crm/leads - Content check if 'data' exists", function() {
  pm.expect((typeof jsonData.data !== "undefined")).to.be.true;
});

// Response body should have a minimum length of "1" for "data"
if (jsonData?.data) {
  pm.test("[GET]::/crm/leads - Content check if value of 'data' has a minimum length of '1'", function() {
    pm.expect(jsonData.data.length).is.at.least(1);
  })};

// Response body should have a maximum length of "20" for "data"
if (jsonData?.data) {
  pm.test("[GET]::/crm/leads - Content check if value of 'data' has a maximum length of '20'", function() {
    pm.expect(jsonData.data.length).is.at.most(20);
  })};

// Response body should have "resource"
pm.test("[GET]::/crm/leads - Content check if 'resource' exists", function() {
  pm.expect((typeof jsonData.resource !== "undefined")).to.be.true;
});

// Response body should have value "companies" for "resource"
if (jsonData?.resource) {
  pm.test("[GET]::/crm/leads - Content check if value for 'resource' matches 'companies'", function() {
    pm.expect(jsonData.resource).to.eql("companies");
  })};

// Response body should not have "@count"
pm.test("[GET]::/crm/leads - Content check if '@count' not exists", function() {
  pm.expect((typeof jsonData["@count"] === "undefined")).to.be.true;
});

// Response body should have "service"
pm.test("[GET]::/crm/leads - Content check if 'service' exists", function() {
  pm.expect((typeof jsonData.service !== "undefined")).to.be.true;
});

// Response body value for "service" "not.to.be.undefined"
if (jsonData?.service) {
  pm.test("[GET]::/crm/leads - Content check if value for 'service' 'not.to.be.undefined'", function() {
    pm.expect(jsonData.service).not.to.be.undefined;
  })};
```

Per defined "contentTest" item, Portman can generate a number of tests:

`key` example:
```js
// Response body should have "data[0].company_name"
pm.test("[GET]::/crm/leads - Content check if 'data[0].company_name' exists", function() {
  pm.expect((typeof jsonData.data[0].company_name !== "undefined")).to.be.true;
});
```

The first check validates if the response has the property "company_name" in the first item ("[0]") of the "data" array.

> **REMARK**:
> In case you want to do a content test for a key & value within an array of objects, you can use `[*]` as a wildcard.

```json
 "responseBodyTests": [
  {
    "key": "data.websites[*].url",
    "value": "http://example.com"
  }
]
```

`value` example:
```js
// Response body should have value "Spacex" for "data[0].company_name"
if (jsonData?.data?.[0]?.company_name) {
  pm.test("[GET]::/crm/leads - Content check if value for 'data[0].company_name' matches 'Spacex'", function() {
    pm.expect(jsonData.data[0].company_name).to.eql("Spacex");
  })};

```

The `value` check validates if the response has value "Spacex" for the property "company_name", using strict equality.

When you add a `contains` test, the check validates if the response contains the value "Musk" in the value of the property "name". The `contains` test is case-sensitive.

`contains` example:
```js
// Response body should contain value "Musk" for "data[0].name"
if (jsonData?.data?.[0]?.name) {
  pm.test("[GET]::/crm/leads - Content check if value for 'data[0].name' contains 'Musk'", function() {
    pm.expect(jsonData.data[0].name).to.include("Musk");
  })};
```

When you add a `oneOf` test, the check validates if the response matches one of the values: "200,201" for the value of the property "status_code".

`oneOf` example:
```js
// Response body should be one of the values "200,201" for "status_code"
if (jsonData?.status_code) {
  pm.test("[GET]::/crm/leads - Content check if value for 'status_code' is matching one of: '200,201'", function() {
    pm.expect(jsonData.status_code).to.be.oneOf([200,201]);
  })};
```

When you add a `length` test, the check validates if the response contains the expected number of characters/array items for the defined key.

`length` example:
```js
// Response body should have a length of "9" for "data[0].description"
if (jsonData?.data?.[0]?.description) {
  pm.test("[GET]::/crm/leads - Content check if value of 'data[0].description' has a length of '9'", function() {
    pm.expect(jsonData.data[0].description.length).to.equal(9);
  })};
```

When you add a `minLength` test, the check validates if the response contains at least the number of characters/array items for the targeted property.

`minLength` example:
```js
// Response body should have a minimum length of "1" for "data"
if (jsonData?.data) {
  pm.test("[GET]::/crm/leads - Content check if value of 'data' has a minimum length of '1'", function() {
    pm.expect(jsonData.data.length).is.at.least(1);
  })};
```

When you add a `maxLength` test, the check validates if the response contains at least the number of characters/array items for the targeted property.

`maxLength` example:
```js
// Response body should have a maximum length of "20" for "data"
if (jsonData?.data) {
  pm.test("[GET]::/crm/leads - Content check if value of 'data' has a maximum length of '20'", function() {
    pm.expect(jsonData.data.length).is.at.most(20);
  })};
```

> **REMARK**:
> When using the content tests for `length`, `minLength`, `maxLength`, Portman will add specific content checks as Postman tests.
> You could also include these types of length validation as part of your [OpenAPI specification](https://spec.openapis.org/oas/v3.0.3#properties), which will include maxLength, minLength, minItems, maxItems as part of the JSON schema validation contract test.

When you add a `notExist` test, the check validates if the response does not contain the targeted property.

`notExist` example:
```js
// Response body should not have "@count"
pm.test("[GET]::/crm/leads - Content check if '@count' not exists", function() {
  pm.expect((typeof jsonData["@count"] === "undefined")).to.be.true;
});
```

The content test options are based on the common use-cases for content test. On the other hand Portman focuses on flexibility and extensibility, so we came up with the "assert" option.
When using the `assert` setting, you can insert a Postman assertion and Portman will include it in the generated Postman collection.
This allows you to use any Postman assertion you want like: null, true, false, Nan, ...

> **Note**
> For a more comprehensive overview of what you can include as Postman assertions, we refer to [Postman assertions docs](https://learning.postman.com/docs/writing-scripts/script-references/test-examples/#common-assertion-examples) and the [Chai Assertion Library docs](https://www.chaijs.com/api/bdd/).

`assert` example:
```js
// Response body value for "service" "not.to.be.undefined"
if (jsonData?.service) {
  pm.test("[GET]::/crm/leads - Content check if value for 'service' 'not.to.be.undefined'", function() {
    pm.expect(jsonData.service).not.to.be.undefined;
  })};
```

---

### responseHeaderTests

After the conversion, in the "leadsOne" request (GET::/crm/leads/:id) in the Postman app, you can find the specific header content tests in the "Tests" tab.

file: examples/testsuite-content-tests/crm.postman.json >>

Postman request "Leads" >> "Get leads" Tests tab:

```javascript
// Validate if response header is present 
pm.test("[GET]::/crm/leads/:id - Response header Operation-Location is present", function () {
  pm.response.to.have.header("Operation-Location");
});

// Response header should have value "/operations/123" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value for 'Operation-Location' matches '/operations/123'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).to.eql("/operations/123");
});

// Response header should contain value "/operations/" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value for 'Operation-Location' contains '/operations/'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).to.include("/operations/");
});

// Response header should have a length of "15" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value of 'Operation-Location' has a length of '15'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).to.have.lengthOf(15);
});

// Response header should have a minimum length of "5" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value of 'Operation-Location' has a minimum length of '5'", function() {
  pm.expect(pm.response.headers.get("Operation-Location").length).is.at.least(5);
});

// Response header should have a maximum length of "20" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value of 'Operation-Location' has a maximum length of '20'", function() {
  pm.expect(pm.response.headers.get("Operation-Location").length).is.at.most(20);
});

// Response header value for "Operation-Location}" "not.to.be.undefined"
pm.test("[GET]::/crm/leads/:id - Content check if header value for 'Operation-Location' 'not.to.be.undefined'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).not.to.be.undefined;
});
```

Similar to the `responseBodyTests`, the content test `responseHeaderTests` will verify the actual content of the headers, with a number of checks

`key` example:
```js
// Validate if response header is present 
pm.test("[GET]::/crm/leads/:id - Response header Operation-Location is present", function () {
  pm.response.to.have.header("Operation-Location");
});
```

The header name will be verified, if it is present in the response. The header name should match the configured `key`.

`value` example:
```js
// Response header should have value "/operations/123" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value for 'Operation-Location' matches '/operations/123'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).to.eql("/operations/123");
});
```

The `value` check validates if the response has value "/operations/123" for the header "Operation-Location", using strict equality.

When you add a `contains` test, the check validates if the response header contains the value "/operations/" in the header value. The `contains` test is case-sensitive.

`contains` example:
```js
// Response header should contain value "/operations/" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value for 'Operation-Location' contains '/operations/'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).to.include("/operations/");
});
```

When you add a `oneOf` test, the check validates if the response header matches one of the defined values.

`oneOf` example:
```js
// Response header should be one of the values "/operations/123,/operations/456" for "Operation-Location"
pm.test("[GET]::/crm/leads - Content check if header value for 'Operation-Location' is matching one of: '/operations/123,/operations/456'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).to.be.oneOf(["/operations/123","/operations/456"]);
});
```

When you add a `length` test, the check validates if the header value contains the expected number of characters.

`length` example:
```js
// Response header should have a length of "15" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value of 'Operation-Location' has a length of '15'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).to.have.lengthOf(15);
});
```

When you add a `minLength` test, the check validates if the header value contains at least the defined number of characters.

`minLength` example:
```js
// Response header should have a minimum length of "5" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value of 'Operation-Location' has a minimum length of '5'", function() {
  pm.expect(pm.response.headers.get("Operation-Location").length).is.at.least(5);
});
```

When you add a `maxLength` test, the check validates if the header value contains at most the defined number of characters.

`maxLength` example:
```js
// Response header should have a maximum length of "20" for "Operation-Location"
pm.test("[GET]::/crm/leads/:id - Content check if header value of 'Operation-Location' has a maximum length of '20'", function() {
  pm.expect(pm.response.headers.get("Operation-Location").length).is.at.most(20);
});
```

Similar like with the `responseBodyTests`, the content test `responseHeaderTests` you can insert a Postman assertion, to validate the content of the header.
When using the `assert` setting, and Portman will include it in the generated Postman collection.
This allows you to use any Postman assertion you want like: null, true, false, Nan, ...

> **Note**
> For a more comprehensive overview of what you can include as Postman assertions, we refer to [Postman assertions docs](https://learning.postman.com/docs/writing-scripts/script-references/test-examples/#common-assertion-examples) and the [Chai Assertion Library docs](https://www.chaijs.com/api/bdd/).

`assert` example:
```js
// Response header value for "Operation-Location}" "not.to.be.undefined"
pm.test("[GET]::/crm/leads/:id - Content check if header value for 'Operation-Location' 'not.to.be.undefined'", function() {
  pm.expect(pm.response.headers.get("Operation-Location")).not.to.be.undefined;
});
```

---

## Alternative targeting option

In the above example we are using the OpenAPI `operationId: leadsOne`to target the content check for that specific operation.

As alternative, you can also define the target as `openApiOperation`, which is the combination of the OpenAPI method & path

In the example below, we target the `GET` method for the path `/crm/leads`.

```json
"contentTests": [
    {
      "openApiOperation": "GET::/crm/leads",
      "responseBodyTests": [
        {
          "key": "data[0].company_name",
          "value": "Spacex"
        },
        {
          "key": "data[0].monetary_amount",
          "value": 75000
        },
        {
          "key": "resource",
          "value": "companies"
        }
      ]
    }
  ]
```

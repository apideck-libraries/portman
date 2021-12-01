# Portman Errors

### ReferenceError: Circular $ref pointer found

---

One or more schemas in your OpenAPI spec have a circular reference, meaning that they reference themselves at the same level.

One example of a circular reference might be a `Box` object with a property called `contains`. The `contains` property references another `Box`.

While JSONSchema allows for circular references, the OpenAPI Specification does not.

As Portman is based on porting your OAS to port to a Postman collection, a valid spec is required.

You now have two options:

- Fix your spec (recommended)
- Pass the `ignoreCircularRefs` option to Portman to ignore circular references in your spec.

While fixing your spec is definitively the better option, you can choose to ignore if your testing strategy does not include validating responses against your defined schema.

To be clear, if `ignoreCircularRefs` is true, JSONSchema Validate will be omitted from your tests regardless of your configuration.

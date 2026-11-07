# Portman Errors

### ReferenceError: Circular $ref pointer found

---

One or more schemas in your OpenAPI spec have a circular reference: a schema that references itself, directly or through other schemas.

One example of a circular reference might be a `Box` object with a property called `contains`. The `contains` property references another `Box`.

Circular references are valid in OpenAPI and JSON Schema. Portman fully dereferences your spec by default, which is impossible for a recursive schema, so it stops with this error.

Pass the `ignoreCircularRefs` option to load the spec anyway:

```
portman -l openapi.yaml --ignoreCircularRefs
```

With `ignoreCircularRefs`, Portman keeps the circular `$ref`s and embeds the referenced schemas as `definitions` in the generated JSON schema test, so responses are still validated against the recursive schema.

Schema validation is only skipped (with a console message in the test script) for a `$ref` Portman can't resolve inside the spec, such as a reference to an external file.

# Portman configuration references

This example contains the setup of Portman where the Portman configuration managed via a JSON/YAML file while using
references ($ref).

_use-case_:

- Reuse of Portman configuration set in multiple Portman setups
- Making it possible to split large configurations to better manage them

## CLI usage

Portman CLI options settings using references in YAML format

```ssh
portman --cliOptionsFile ./examples/config-references/portman-cli-options.yaml
```

Portman CLI options settings using references in JSON format

```ssh
portman --cliOptionsFile ./examples/config-references/portman-cli-options.json
```

## Example explained

In the `portman-config.crm.yaml|json` file, we reference parts of the configuration that are defined in others files in
the "definitions" folders.

```yaml
version: 1
tests:
  contractTests:
    $ref: './examples/config-references/definitions/test-contracts.yaml#/contractTests'
  contentTests:
    $ref: './examples/config-references/definitions/test-content.yaml#/contentTests'
globals:
  $ref: 'https://raw.githubusercontent.com/apideck-libraries/portman/main/examples/config-references/definitions/globals.yaml#/globals'
```

The $ref properties refer to the local or remote file path and the path to the definition.
This $ref can be:

- a local JSON or YAML file
- a remote JSON or YAML file

local file example `$ref: './examples/config-references/definitions/test-contracts.yaml#/contractTests'`
- file path: `./examples/config-references/definitions/test-contracts.yaml`
- definition path: `#/contractTests`

remote file example `$ref: 'https://raw.githubusercontent.com/apideck-libraries/portman/main/examples/config-references/definitions/globals.yaml#/globals'`
- file path: `https://raw.githubusercontent.com/apideck-libraries/portman/main/examples/config-references/definitions/globals.yaml`
- definition path: `#/globals`


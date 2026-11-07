// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>

export interface EmbedRefDefinitionsResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any
  // true when every $ref in the schema now points at an embedded definition
  resolved: boolean
}

// Keys whose values are data, not schemas, so a "$ref" string inside them must not be followed
const DATA_KEYS = new Set(['example', 'examples', 'enum', 'const', 'default'])

const DEFINITIONS_KEY = 'definitions'

export const resolvePointer = (doc: AnyObject, ref: string): unknown => {
  if (!ref.startsWith('#/')) return undefined
  const tokens = ref
    .slice(2)
    .split('/')
    .map(token => decodeURIComponent(token).replace(/~1/g, '/').replace(/~0/g, '~'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = doc
  for (const token of tokens) {
    if (node === null || typeof node !== 'object' || !(token in node)) return undefined
    node = node[token]
  }
  return node
}

/**
 * Follows a chain of local `$ref`s (e.g. a response object that points at
 * `#/components/responses/Foo`) until it reaches an object without `$ref`.
 * Returns the input unchanged when it can't be resolved.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const resolveLocalRef = <T = any>(obj: T, doc?: AnyObject): T => {
  let current: any = obj // eslint-disable-line @typescript-eslint/no-explicit-any
  const seen = new Set<string>()
  while (doc && current && typeof current === 'object' && typeof current.$ref === 'string') {
    const ref = current.$ref as string
    if (seen.has(ref)) return obj
    seen.add(ref)
    const target = resolvePointer(doc, ref)
    if (target === undefined) return obj
    current = target
  }
  return current
}

const definitionNameFor = (ref: string, taken: Set<string>): string => {
  const componentMatch = ref.match(/^#\/components\/schemas\/([^/]+)$/)
  const base = componentMatch
    ? decodeURIComponent(componentMatch[1]).replace(/~1/g, '/').replace(/~0/g, '~')
    : ref.slice(2)
  const safe = base.replace(/[^A-Za-z0-9_.-]/g, '_') || 'ref'
  let name = safe
  let i = 2
  while (taken.has(name)) name = `${safe}_${i++}`
  taken.add(name)
  return name
}

/**
 * Makes a response schema that still contains local `$ref`s (left behind when circular references
 * are ignored during dereferencing) self-contained, so it can be validated by a JSON Schema
 * validator such as Ajv.
 *
 * Every referenced schema is copied from the OpenAPI document into a `definitions` map and the
 * `$ref`s are rewritten to point at it. Recursive schemas stay recursive, which JSON Schema
 * supports. The original schema is wrapped in `allOf` so a root-level `$ref` keeps working with
 * validators that ignore keywords next to `$ref`.
 */
export const embedRefDefinitions = (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  schema: any,
  oasDoc?: AnyObject
): EmbedRefDefinitionsResult => {
  if (!schema || typeof schema !== 'object' || !JSON.stringify(schema).includes('"$ref"')) {
    return { schema, resolved: true }
  }
  if (!oasDoc) return { schema, resolved: false }

  const nameByRef = new Map<string, string>()
  const taken = new Set<string>()
  const definitions: AnyObject = {}
  const pending: { ref: string; name: string }[] = []
  let resolved = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rewrite = (node: any): any => {
    if (Array.isArray(node)) return node.map(rewrite)
    if (node === null || typeof node !== 'object') return node

    const out: AnyObject = {}
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') {
        if (!value.startsWith('#/') || resolvePointer(oasDoc, value) === undefined) {
          resolved = false
          out[key] = value
          continue
        }
        let name = nameByRef.get(value)
        if (!name) {
          name = definitionNameFor(value, taken)
          nameByRef.set(value, name)
          pending.push({ ref: value, name })
        }
        out[key] = `#/${DEFINITIONS_KEY}/${encodeURIComponent(name)}`
      } else if (DATA_KEYS.has(key)) {
        out[key] = value
      } else {
        out[key] = rewrite(value)
      }
    }
    return out
  }

  const root = rewrite(schema)
  while (pending.length > 0) {
    const { ref, name } = pending.shift() as { ref: string; name: string }
    definitions[name] = rewrite(resolvePointer(oasDoc, ref))
  }

  return {
    schema: { allOf: [root], [DEFINITIONS_KEY]: definitions },
    resolved
  }
}

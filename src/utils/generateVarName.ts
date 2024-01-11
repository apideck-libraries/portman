import { OasMappedOperation } from '../oas'
import { changeCase } from 'openapi-format'

export type GenerateVarNameOptions = {
  casing?: string
  prefix?: string
  suffix?: string
}

export type GenerateVarNameDTO = {
  template?: string
  oaOperation?: OasMappedOperation | null
  dynamicValues?: Record<string, string>
  options?: GenerateVarNameOptions
}

/**
 * Method to generate a variable name based on a template string
 * @param template the template string with expressions to be replaced
 * @param oaOperation the OpenAPI operation object
 * @param dynamicValues an object containing dynamic values for each placeholder
 * @param options an object containing options for the variable name generation
 */
export const generateVarName = ({
  template = '<opsRef>.<varProp>',
  oaOperation,
  dynamicValues,
  options
}: GenerateVarNameDTO): string => {
  // Early exit if no template is defined or not a string
  if (!template || typeof template !== 'string') return template

  let varName = template

  // Get path parts from OpenAPI path, and build up a object with incremental variable names partPart1, pathPart2, etc.
  let partsCounter = 0
  const pathParts = oaOperation?.path?.split('/') ?? []
  const pathPartsObj = pathParts.reduce((acc, pathPart) => {
    if (pathPart.trim() !== '') {
      partsCounter++
      acc[`pathPart${partsCounter}`] = pathPart
    }
    return acc
  }, {})

  // Get all OpenAPI tags, and build up a object with incremental variable names tag1, tag2, etc.
  const tags = oaOperation?.tags ?? []
  const tagsObj = tags.reduce((acc, tag, index) => {
    acc[`tag${index + 1}`] = tag
    return acc
  }, {})

  // Get the OpenAPI info object
  const openApiInfo =
    {
      operationId: oaOperation?.id,
      path: oaOperation?.path,
      pathRef: oaOperation?.pathRef,
      method: oaOperation?.method,
      opsRef: oaOperation?.id ?? oaOperation?.pathRef,
      tag: oaOperation?.tags?.[0]
    } || {}

  // Merge dynamic values with OpenAPI info into the template values object
  const tplValues = { ...pathPartsObj, ...tagsObj, ...openApiInfo, ...dynamicValues } as Record<
    string,
    string
  >

  // Define symbols for start and end of placeholders
  const startSymbol = '<'
  const endSymbol = '>'

  // Regular expression to match placeholders
  const placeholderRegex = new RegExp(`${startSymbol}(.*?)${endSymbol}`, 'g')

  // Replace each placeholder with the corresponding dynamic value
  varName = varName.replace(placeholderRegex, (_, placeholder) => {
    // Trim any extra spaces around the placeholder
    placeholder = placeholder.trim()

    // Use dynamic value if available, otherwise keep the remove the placeholder
    const tplValue = tplValues[placeholder]
    return tplValue ? tplValue : ''
    // return tplValue !== undefined ? tplValue : `<${placeholder}>`
  })

  // Add prefix and suffix
  if (options?.prefix) {
    varName = options.prefix.trim() + varName
  }

  if (options?.suffix) {
    varName = varName + options.suffix.trim()
  }

  // Apply casing
  if (options?.casing) {
    varName = changeCase(varName.trim(), options.casing)
  }

  return varName
}

export const hasTpl = (template: string): boolean => {
  const symbolsRegex = /<|>/
  return symbolsRegex.test(template)
}

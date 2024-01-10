import { OasMappedOperation } from 'oas'
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

  // Get the OpenAPI info object
  const openApiInfo =
    {
      operationId: oaOperation?.id,
      path: oaOperation?.path,
      pathRef: oaOperation?.pathRef,
      method: oaOperation?.method,
      opsRef: oaOperation?.id ?? oaOperation?.pathRef
    } || {}

  // Merge dynamic values with OpenAPI info into the template values object
  const tplValues = { ...openApiInfo, ...dynamicValues } as Record<string, string>

  // Define symbols for start and end of placeholders
  const startSymbol = '<'
  const endSymbol = '>'

  // Regular expression to match placeholders
  const placeholderRegex = new RegExp(`${startSymbol}(.*?)${endSymbol}`, 'g')

  // Replace each placeholder with the corresponding dynamic value
  varName = varName.replace(placeholderRegex, (_, placeholder) => {
    // Trim any extra spaces around the placeholder
    placeholder = placeholder.trim()

    // Use dynamic value if available, otherwise keep the placeholder
    const tplValue = tplValues[placeholder]
    return tplValue !== undefined ? tplValue : `<${placeholder}>`
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

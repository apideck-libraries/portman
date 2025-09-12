import { OasMappedOperation, OpenApiParser } from '../../src/oas'

export const getOasMappedOperation = async (): Promise<OasMappedOperation> => {
  const oasYml = '__tests__/fixtures/crm.yml'
  const oasParser = new OpenApiParser()

  await oasParser.convert({ inputFile: oasYml })
  return oasParser.mappedOperations[2]
}

export const getOasMappedCreateOperation = async (): Promise<OasMappedOperation> => {
  const oasYml = '__tests__/fixtures/crm.yml'
  const oasParser = new OpenApiParser()

  await oasParser.convert({ inputFile: oasYml })
  return oasParser.mappedOperations[1]
}

export const getOasMappedCreateArrayOperation = async (): Promise<OasMappedOperation> => {
  const oasYml = '__tests__/fixtures/crm-request-items.yml'
  const oasParser = new OpenApiParser()

  await oasParser.convert({ inputFile: oasYml })
  return oasParser.mappedOperations[0]
}

export const getOasMappedListArrayOperation = async (): Promise<OasMappedOperation> => {
  const oasYml = '__tests__/fixtures/crm-request-array.yml'
  const oasParser = new OpenApiParser()

  await oasParser.convert({ inputFile: oasYml })
  return oasParser.mappedOperations[1]
}

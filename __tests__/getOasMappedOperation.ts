import { OpenApiParser } from '../src/application'
import { OasMappedOperation } from '../src/lib'

export const getOasMappedOperation = async (): Promise<OasMappedOperation> => {
  const oasYml = '__tests__/fixtures/crm.yml'
  const oasParser = new OpenApiParser()

  await oasParser.convert({ inputFile: oasYml })
  return oasParser.mappedOperations[2]
}

// express.js
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import yaml from 'js-yaml'
import { env } from '@/config/env.js'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// router
const router = Router()

// Cache for combined spec (optional optimization)
let cachedSpec: any = null

/**
 * Combine all OpenAPI YAML files into a single specification
 */
const combineOpenAPISpecs = () => {
  try {
    // Read main specification
    const mainYamlPath = join(__dirname, '../../../docs/main.yaml')
    const mainSpec = yaml.load(readFileSync(mainYamlPath, 'utf8')) as any

    // Read module specifications dynamically
    const moduleSpecs: Array<{ name: string; spec: any }> = []
    const moduleDir = join(__dirname, '../')

    // Dynamically discover module YAML files
    readdirSync(moduleDir).forEach(moduleName => {
      const yamlPath = join(moduleDir, moduleName, `${moduleName}.yaml`)
      if (existsSync(yamlPath)) {
        try {
          const spec = yaml.load(readFileSync(yamlPath, 'utf8')) as any
          moduleSpecs.push({ name: moduleName, spec })
          console.log(`Loaded OpenAPI spec from module: ${moduleName}`)
        } catch (error) {
          console.warn(`Could not load ${moduleName}.yaml:`, error)
        }
      }
    })

    // Merge all specifications
    const combinedSpec = { ...mainSpec }

    // Merge paths with collision detection
    moduleSpecs.forEach(({ name, spec }) => {
      if (spec.paths) {
        for (const path in spec.paths) {
          if (combinedSpec.paths?.[path]) {
            console.warn(
              `Duplicate path detected in OpenAPI: ${path} (from module: ${name}). Overwriting...`
            )
          }
        }
        combinedSpec.paths = { ...combinedSpec.paths, ...spec.paths }
      }
    })

    // Merge components/schemas with collision detection
    moduleSpecs.forEach(({ name, spec }) => {
      if (spec.components?.schemas) {
        if (!combinedSpec.components) {
          combinedSpec.components = {}
        }
        if (!combinedSpec.components.schemas) {
          combinedSpec.components.schemas = {}
        }

        // Check for schema collisions
        for (const schemaName in spec.components.schemas) {
          if (combinedSpec.components.schemas[schemaName]) {
            console.warn(
              `Duplicate schema detected in OpenAPI: ${schemaName} (from module: ${name}). Overwriting...`
            )
          }
        }

        combinedSpec.components.schemas = {
          ...combinedSpec.components.schemas,
          ...spec.components.schemas
        }
      }
    })

    // Merge components/securitySchemes with collision detection
    moduleSpecs.forEach(({ name, spec }) => {
      if (spec.components?.securitySchemes) {
        if (!combinedSpec.components) {
          combinedSpec.components = {}
        }
        if (!combinedSpec.components.securitySchemes) {
          combinedSpec.components.securitySchemes = {}
        }

        // Check for security scheme collisions
        for (const schemeName in spec.components.securitySchemes) {
          if (combinedSpec.components.securitySchemes[schemeName]) {
            console.warn(
              `Duplicate security scheme detected in OpenAPI: ${schemeName} (from module: ${name}). Overwriting...`
            )
          }
        }

        combinedSpec.components.securitySchemes = {
          ...combinedSpec.components.securitySchemes,
          ...spec.components.securitySchemes
        }
      }
    })

    return combinedSpec
  } catch (error) {
    console.error('Error combining OpenAPI specs:', error)
    throw error
  }
}

/**
 * Get combined spec with caching
 */
const getCombinedSpec = () => {
  // In development, always regenerate to see changes
  // In production, use cache
  const shouldUseCache = env.NODE_ENV === 'production'

  if (shouldUseCache && cachedSpec) {
    return cachedSpec
  }

  cachedSpec = combineOpenAPISpecs()
  return cachedSpec
}

/**
 * @route GET /docs
 * @description Serve interactive API documentation using Swagger UI
 * @access Public
 */
router.use('/', swaggerUi.serve)

router.get(
  '/',
  swaggerUi.setup(getCombinedSpec(), {
    explorer: true,
    customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #fca130; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e; }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #50e3c2; }
  `,
    customSiteTitle: 'Nodejs API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1
    }
  })
)

/**
 * @route GET /docs/json
 * @description Get the combined OpenAPI specification as JSON
 * @access Public
 */
router.get('/json', (req, res) => {
  try {
    const spec = getCombinedSpec()
    res.json(spec)
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Error generating OpenAPI specification',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

/**
 * @route GET /docs/yaml
 * @description Get the combined OpenAPI specification as YAML
 * @access Public
 */
router.get('/yaml', (req, res) => {
  try {
    const spec = getCombinedSpec()
    const yamlString = yaml.dump(spec, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    })

    res.setHeader('Content-Type', 'text/yaml')
    res.send(yamlString)
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Error generating OpenAPI specification',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

export default router

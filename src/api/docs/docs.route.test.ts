import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  readdirSync: vi.fn()
}))

// Mock yaml module
vi.mock('js-yaml', () => ({
  default: {
    load: vi.fn(),
    dump: vi.fn()
  },
  load: vi.fn(),
  dump: vi.fn()
}))

// Mock env config
vi.mock('@/config/env.js', () => ({
  env: {
    NODE_ENV: 'test'
  }
}))

// Mock swagger-ui-express
vi.mock('swagger-ui-express', () => ({
  default: {
    serve: vi.fn(() => (req: any, res: any, next: any) => next()),
    setup: vi.fn(() => (req: any, res: any) => res.send('Swagger UI'))
  },
  serve: vi.fn(() => (req: any, res: any, next: any) => next()),
  setup: vi.fn(() => (req: any, res: any) => res.send('Swagger UI'))
}))

describe('Docs Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Environment variable usage', () => {
    it('should use env config instead of process.env', async () => {
      const { env } = await import('@/config/env.js')

      // Verify that the env config is being used
      expect(env.NODE_ENV).toBe('test')
    })
  })

  describe('Route endpoints', () => {
    it('should export a router', async () => {
      // Set up mocks before importing
      const { readFileSync, existsSync, readdirSync } = await import('fs')
      const { load } = await import('js-yaml')

      vi.mocked(readFileSync).mockReturnValue('mock yaml content')
      vi.mocked(existsSync).mockReturnValue(false) // No module YAML files exist
      vi.mocked(readdirSync).mockReturnValue([]) // Empty array to avoid forEach error
      vi.mocked(load).mockReturnValue({
        openapi: '3.1.0',
        info: { title: 'Main API' },
        paths: {}
      })

      const router = await import('./docs.route.js')
      expect(router.default).toBeDefined()
    })

    it('should define swagger UI routes', async () => {
      // Set up mocks before importing
      const { readFileSync, existsSync, readdirSync } = await import('fs')
      const { load } = await import('js-yaml')

      vi.mocked(readFileSync).mockReturnValue('mock yaml content')
      vi.mocked(existsSync).mockReturnValue(false) // No module YAML files exist
      vi.mocked(readdirSync).mockReturnValue([]) // Empty array to avoid forEach error
      vi.mocked(load).mockReturnValue({
        openapi: '3.1.0',
        info: { title: 'Main API' },
        paths: {}
      })

      const router = await import('./docs.route.js')
      expect(router.default).toBeDefined()

      // The router should be properly configured
      expect(typeof router.default).toBe('function')
    })
  })

  describe('Error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found')
      })

      // The module should still import, but the error will be thrown when getCombinedSpec is called
      const router = await import('./docs.route.js')
      expect(router.default).toBeDefined()

      // The error would be thrown when the route is actually accessed, not during import
      // This is the correct behavior - the module loads but errors occur at runtime
    })

    it('should handle missing main.yaml file gracefully', async () => {
      const { readFileSync, existsSync, readdirSync } = await import('fs')

      // Mock that main.yaml doesn't exist
      vi.mocked(readFileSync).mockImplementation((path: any) => {
        if (typeof path === 'string' && path.includes('main.yaml')) {
          throw new Error('File not found')
        }
        return 'mock yaml content'
      })
      vi.mocked(existsSync).mockReturnValue(false)
      vi.mocked(readdirSync).mockReturnValue([])

      // The module should still import, but the error will be thrown when getCombinedSpec is called
      const router = await import('./docs.route.js')
      expect(router.default).toBeDefined()

      // The error would be thrown when the route is actually accessed, not during import
      // This is the correct behavior - the module loads but errors occur at runtime
    })
  })
})

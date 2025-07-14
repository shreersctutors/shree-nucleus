import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the project root directory
const rootDir = path.resolve(__dirname, '..')
// Path to the src directory
const srcDir = path.resolve(rootDir, 'src')
// Path to env.ts file (the only file that should use process.env)
const envFilePath = path.resolve(srcDir, 'config', 'env.ts')

/**
 * Recursively get all TypeScript files in a directory
 */
const getAllTsFiles = (dir: string, fileList: string[] = []): string[] => {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      fileList = getAllTsFiles(filePath, fileList)
    } else if (
      stat.isFile() &&
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.spec.ts') &&
      filePath !== envFilePath
    ) {
      fileList.push(filePath)
    }
  })

  return fileList
}

/**
 * This test ensures that process.env is only accessed directly in the env.ts file.
 *
 * Why this matters:
 * 1. Centralized configuration makes the codebase more maintainable
 * 2. Type safety is enforced through the env object
 * 3. Default values and validation happen in one place
 * 4. Testing is easier when environment variables are accessed through a single module
 *
 * Note about Docker/EBS: This pattern is fully compatible with containerized environments
 * and AWS Elastic Beanstalk. Those platforms set environment variables at the system level,
 * which are then read by env.ts and made available through the exported env object.
 */
describe('Environment Variable Usage', () => {
  it('process.env should only be used in env.ts', () => {
    // Get all TypeScript files except env.ts and test files
    const tsFiles = getAllTsFiles(srcDir)

    // Check each file for process.env usage
    const filesWithProcessEnv = tsFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8')
      return content.includes('process.env')
    })

    // If any files use process.env, the test will fail
    if (filesWithProcessEnv.length > 0) {
      console.error('The following files use process.env directly:')
      filesWithProcessEnv.forEach(file => {
        console.error(`- ${path.relative(rootDir, file)}`)
      })
    }

    // Cleaner assertion that directly expresses what we expect
    expect(filesWithProcessEnv).toEqual([])
  })
})

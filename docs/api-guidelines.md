# API Guidelines for Shree Nucleus

This document outlines the conventions and best practices for API development in this project. Following these guidelines will ensure consistency across the codebase and make it easier for both developers and AI tools to work with the API.

## Response Format

All API responses should follow this standard JSON format:

```json
{
  "status": 200,
  "message": "Success message",
  "data": {
    // Response data object (for successful responses)
  }
}
```

For error responses:

```json
{
  "status": 400,
  "message": "Error message",
  "error": {
    // Error details
  }
}
```

## HTTP Status Codes

Use appropriate HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource successfully created
- `204 No Content`: Successful request with no response body
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authentication valid but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Request conflicts with current state
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server-side error

## Route Naming Conventions

### Base URL Structure

```
/api/{resource}
```

### Resource Naming

- Use plural nouns for resources (e.g., `/users`, not `/user`)
- Use kebab-case for multi-word resources (e.g., `/user-profiles`)
- Nest resources to show relationships (e.g., `/users/{userId}/posts`)

### Common Patterns

| HTTP Method | Path                         | Description                      |
| ----------- | ---------------------------- | -------------------------------- |
| GET         | /resources                   | List resources (with pagination) |
| GET         | /resources/{id}              | Get a specific resource          |
| POST        | /resources                   | Create a new resource            |
| PUT         | /resources/{id}              | Replace a resource completely    |
| PATCH       | /resources/{id}              | Update a resource partially      |
| DELETE      | /resources/{id}              | Delete a resource                |
| GET         | /resources/{id}/subresources | Get subresources of a resource   |

### Query Parameters

- Use for filtering, sorting, pagination, and field selection
- Use camelCase for parameter names
- Common parameters:
  - `limit`: Number of items to return
  - `offset`: Number of items to skip
  - `sortBy`: Field to sort by
  - `sortOrder`: Sort direction (`asc` or `desc`)
  - `fields`: Comma-separated list of fields to include

## Route Documentation

Use consistent comment blocks above route handlers:

```typescript
/**
 * @route GET /api/v1/users/{id}
 * @description Get user by ID
 * @param {string} id - User ID
 * @returns {Object} User object
 */
```

## Request Validation

- Validate all request inputs
- Use module-level validator files
- Return detailed validation errors

## Authentication

- Use Bearer token authentication for protected routes
- Include token validation in middleware
- Document authentication requirements in OpenAPI specs

## OpenAPI Documentation

- Document all endpoints in OpenAPI YAML files
- Keep module-specific documentation in module folders
- Reference common components from the main OpenAPI file

## Error Handling

- Use the global error handler middleware for consistent error handling
- Use `catchAsync` wrapper for async route handlers
- Use `asyncRouter` for automatic error handling in route modules
- Use `createAppError` to create custom error objects
- Include helpful error messages
- Log detailed errors server-side but return sanitized responses

## Coding Style

- Always use arrow functions instead of traditional function declarations
- Use async/await for asynchronous operations
- Follow TypeScript best practices with proper type annotations
- Use destructuring for cleaner code

## Examples

### Route Handler Example

```typescript
/**
 * @route GET /api/users/{id}
 * @description Get user by ID
 * @param {string} id - User ID
 * @returns {Object} User object with profile information
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.findById(req.params.id)

  if (!user) {
    // Use createAppError to generate a properly formatted error
    throw createAppError('User not found', 404)
  }

  res.status(200).json({
    status: 200,
    message: 'User retrieved successfully',
    data: user
  })

  // No try/catch needed - errors are automatically caught by catchAsync wrapper
  // and passed to the global error handler middleware
}
```

### Validation Example

```typescript
// requestHygiene.ts
import { z } from 'zod'

// Define the schema with strong typing
export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required')
})

// Type derived from the schema
export type CreateUserRequest = z.infer<typeof createUserSchema>

// Validation middleware
export const validateCreateUser = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Validate and transform the request body
    const validatedData = createUserSchema.parse(req.body)

    // Replace the request body with the validated data
    req.body = validatedData
    next()
  } catch (error) {
    // For validation middleware, we still use try/catch but leverage createAppError
    if (error instanceof z.ZodError) {
      // Pass a custom error to the global error handler
      next(createAppError('Validation failed', 422))
    } else {
      // Pass unexpected errors to the global error handler
      next(error)
    }
  }
}

// controller.ts
export const createUser = async (
  req: Request<{}, {}, CreateUserRequest>,
  res: Response
): Promise<void> => {
  // Request body is already validated and typed
  const { email, password, name } = req.body

  // Process valid request...
  // TypeScript will provide full type safety for req.body

  // No try/catch needed - errors are automatically caught by catchAsync wrapper
  // or when using asyncRouter

  // Return success response
  res.status(201).json({
    status: 201,
    message: 'User created successfully',
    data: {
      /* user data */
    }
  })
}
```

# Shree Nucleus - Modern TypeScript Express Server

A modern, modular TypeScript Node.js Express server with a comprehensive tech stack and best practices.

## Tech Stack

- **Core**: Node.js 22.16, TypeScript, Express 5.x
- **Database**: MySQL (Prisma ORM), MongoDB (Native Driver)
- **Cloud**: AWS Elastic Beanstalk, S3
- **Authentication**: Firebase Auth
- **Documentation**: OpenAPI YAML
- **Testing**: Vitest
- **Containerization**: Docker
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Utilities**: Morgan, Helmet.js, Multer, PDF processing tools

## Project Structure

```
src/
├── api/                      # API modules
│   ├── auth/                 # Authentication module
│   │   ├── auth.route.ts              # Route definitions
│   │   ├── auth.routeController.ts    # Express handlers
│   │   ├── auth.requestHygiene.ts     # Request validation
│   │   ├── auth.service.ts            # External service integrations (Firebase, AWS S3, etc.)
│   │   ├── auth.prisma.ts             # Database operations (Prisma - SQL)
│   │   ├── auth.mongodb.ts            # Database operations (MongoDB)
│   │   ├── auth.types.ts              # TypeScript types
│   │   ├── auth.yaml                  # OpenAPI documentation
│   │   └── auth.*.test.ts             # Tests
│   └── other-modules/        # Other API modules following the same pattern
├── config/                   # Configuration files
│   ├── aws.ts
│   ├── env.ts
│   └── firebase.ts
├── db/                       # Database connections and models
│   ├── mongodb.ts            # MongoDB connection and utilities
│   ├── mysql.ts              # MySQL connection (legacy)
│   └── prisma/               # Prisma schema and client
│       ├── client.ts
│       └── schema.prisma
├── lib/                      # Libraries
├── middleware/               # Shared middlewares
│   ├── error/                # Error handling middleware
│   ├── logging/              # Logging middleware
│   └── security/             # Security middleware (CORS, Helmet)
├── app.ts                    # Express app initialization
└── server.ts                 # Main server entry point
tests/                        # Global test files
docs/                         # OpenAPI documentation
scripts/                      # Deployment scripts
```

## Getting Started

### Prerequisites

- Node.js 22.16 or later
- npm 10 or later
- [AWS Elastic Beanstalk CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html#eb-cli3-install)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Docker (needed, for containerization and deployment)
- MySQL (optional, for local development)
- MongoDB (optional, for local development)
- Firebase project (for authentication)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd shree-nucleus
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment files:

   ```bash
   cp .env.example .env
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

### Docker

Build and run the Docker container:

```bash
docker build -t shree-nucleus .
docker run -p 3000:3000 shree-nucleus
```

## Development

### Code Standards

Key guidelines include:

- **Arrow functions only** - No traditional function declarations
- **ES modules** - Use `import`/`export` syntax
- **No semicolons** - Project uses `"semi": false`
- **Single quotes** - Use single quotes for strings
- **Tabs for indentation** - Use tabs, not spaces
- **Database separation** - Prisma for SQL, MongoDB driver for NoSQL
- **Service layer pattern** - External integrations in service files, business logic in controllers
- **Global error handling** - Use `createAppError` for consistent errors

For complete coding standards, see `docs/api-guidelines.md`.

### Available Scripts

- `npm run build` - Build the TypeScript code
- `npm run start` - Run the built application
- `npm run dev` - Run the application in development mode with hot reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Deployment (AWS Elastic Beanstalk)

### Deployment Configuration
This project does **not** include the `.elasticbeanstalk` folder in version control. Each user should initialize AWS Elastic Beanstalk and configure their own environment.

**Steps:**

1. Make the deployment script executable (one-time setup):
   ```sh
   chmod +x scripts/deploy.sh
   ```
2. Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html) if you haven't already.
3. Configure your AWS credentials for the `eb-cli` profile (if not already done):
   ```sh
   aws configure --profile eb-cli
   ```
   > **Note:** We use a dedicated `eb-cli` profile to separate Elastic Beanstalk deployment credentials from your default AWS credentials. This allows for different permission sets and better security isolation.
4. Initialize Elastic Beanstalk in your project directory:
   ```sh
   eb init --profile eb-cli
   ```
   - Follow the prompts to select your AWS region, application, and environment.
   - This will create your own `.elasticbeanstalk` folder (which is gitignored).
5. Deploy to your chosen environment:
   ```sh
   eb create <environment-name> --profile eb-cli
   # or, to deploy to an existing environment:
   eb deploy --profile eb-cli
   ```

**Note:**
- The `.elasticbeanstalk` folder is in `.gitignore` and should not be committed.
- Each user should set up their own AWS credentials and environment as needed.
- For more details, see the [AWS EB CLI documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html).

### Deployment Script (`scripts/deploy.sh`)

A deployment script is provided to streamline the deployment process. **You must still initialize your own AWS/EB config as described above.**

**Features:**
- Runs tests before deploying
- Checks for uncommitted Git changes
- Deploys to AWS Elastic Beanstalk using the `eb-cli` AWS profile
- Supports environment and verbose flags
- Shows help information

**Usage:**
```sh
# Deploy using the default environment and eb-cli profile
./scripts/deploy.sh

# Deploy with verbose output (for debugging)
./scripts/deploy.sh --verbose   # shorthand: -v

# Deploy to a specific environment
./scripts/deploy.sh --environment production   # shorthand: -e production

# Deploy to a specific environment with verbose output
./scripts/deploy.sh --environment production --verbose # shorthand: -e production -v

# Show help
./scripts/deploy.sh --help   # shorthand: -h
```

**Note:**
- The script expects you to have already run `eb init --profile eb-cli` and configured your AWS credentials for the `eb-cli` profile.
- The script will abort if there are uncommitted changes or if tests fail.

### Code Quality

This project uses ESLint and Prettier for code quality and formatting. Husky and lint-staged are configured to run linting and formatting on staged files before commits.

## API Documentation

API documentation is generated from OpenAPI YAML files located in each module folder. The base OpenAPI specification is located at `docs/main.yaml`.

## License

This project is licensed under the [MIT License](./LICENSE).
See the [Open Source Initiative page for the MIT License](https://opensource.org/licenses/MIT) for more details.

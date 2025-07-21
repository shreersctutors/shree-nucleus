# Shree Nucleus - Modern TypeScript Express Server

A modern, modular TypeScript Node.js Express server with a comprehensive tech stack and best practices.

**⚠️ Platform Compatibility Notice**

> This project is designed for **Linux** and **macOS** environments.
>
> - The included Husky pre-commit hooks and deployment scripts rely on Bash and will **not work natively on Windows**.
> - **Windows users:** You can fully use this project by running it inside [Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/).
> - All development, testing, and deployment commands should be run from a WSL terminal for best compatibility.

---

## Index

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Getting Started](#3-getting-started)
4. [Environment Variables](#4-environment-variables)
5. [Service Configuration & Client Structure](#5-service-configuration--client-structure)
6. [Prisma Setup](#6-prisma-setup)
7. [Development](#7-development)
8. [Deployment (AWS Elastic Beanstalk)](#8-deployment-aws-elastic-beanstalk)
9. [API Documentation](#9-api-documentation)
10. [Acknowledgements](#10-acknowledgements)
11. [License](#11-license)

---

## 1. Tech Stack

- **Core**: Node.js 22.16, TypeScript, Express 5.x
- **Database**: MySQL (Prisma ORM), MongoDB (Native Driver)
- **Cloud**: AWS Elastic Beanstalk, S3
- **Authentication**: Firebase Auth
- **Documentation**: OpenAPI YAML
- **Testing**: Vitest
- **Containerization**: Docker
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Utilities**: Morgan, Helmet.js, Multer, PDF processing tools

---

## 2. Project Structure

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
├── lib/                      # Shared libraries (e.g., date/time utils, conversions)
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

---

## 3. Getting Started

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

   > **Note:**  
   > This project will **not start** if any required environment variable is missing.  
   > The configuration system (`src/config/env.ts`) will throw a clear error and show you which variable is missing.  
   > Be sure to fill in all necessary values in your `.env` file **before** running tests, starting the development server, or building the Docker image.

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

> **Note:**  
> If you change the `PORT` environment variable in your `.env` file, make sure to:
>
> - Update the `EXPOSE` line in your `Dockerfile` to match the new port.
> - Update your Docker run command to map the correct port.
>
> For example, if you set `PORT=4000`:
>
> - Change `EXPOSE 3000` to `EXPOSE 4000` in your `Dockerfile`.
> - Run:
>   ```sh
>   docker run -p 4000:4000 shree-nucleus
>   ```

---

## 4. Environment Variables

All required environment variables are listed and documented in the `.env.example` file at the root of this project.  
Copy it to `.env` and fill in your own values before running the app, tests, or Docker build.  
If any required variable is missing, the app will not start and you’ll see an error message.

---

## 5. Service Configuration & Client Structure

This project separates configuration and client/connection logic for each service:

| Service  | Config Location               | Client/Connection Location | What goes where?                                                                                 |
| -------- | ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| MySQL    | `src/config/mysql.ts`         | `src/db/mysql.ts`          | Config: host, port, user, db, etc. Client: MySQL pool using config                               |
| MongoDB  | `src/config/mongodb.ts`       | `src/db/mongodb.ts`        | Config: URI, db name. Client: MongoClient and `getDb()` using config                             |
| Prisma   | `src/db/prisma/schema.prisma` | `src/db/prisma/client.ts`  | Config: DATABASE_URL. Client: PrismaClient (generated in lib/prisma, then imported to db/prisma) |
| S3       | `src/config/aws.ts`           | `src/db/s3.ts`             | Config: region, bucket, credentials. Client: S3Client using config                               |
| Firebase | `src/config/firebase.ts`      | `src/db/firebase.ts`       | Config: project ID, keys, etc. Client: Firebase Admin SDK instance                               |

### ⚠️ Optional Services

If you do **not** wish to use a particular service (e.g., AWS, MongoDB, Firebase, etc.),  
**you must remove or comment out its usage in `src/config/env.ts` and any related config files.**  
This will prevent the application from trying to load or connect to unused services.

---

## 6. Prisma Setup

To use Prisma in this project:

1. **Configure your database connection string** in `.env` as `DATABASE_URL`.
2. **Pull your database schema** (if you have an existing DB):
   ```sh
   npx prisma db pull
   ```
3. **Generate the Prisma client** (required after every schema change or fresh clone):
   ```sh
   npx prisma generate
   ```
   > The generated client is located in `src/lib/prisma` and is gitignored.  
   > Each developer must run `prisma generate` locally after cloning or pulling changes.

---

## 7. Development

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

---

## 8. Deployment (AWS Elastic Beanstalk)

### Deployment Configuration

This project does **not** include the `.elasticbeanstalk` folder in version control. Each user should initialize AWS Elastic Beanstalk and configure their own environment.

**Steps:**

1. Make the deployment script executable (one-time setup):
   ```sh
   chmod +x scripts/deploy.sh
   ```
2. Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html#eb-cli3-install) if you haven't already.
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

## 9. API Documentation

API documentation is generated from OpenAPI YAML files located in each module folder. The base OpenAPI specification is located at `docs/main.yaml`.

## 10. Acknowledgements

Authored by [Javid Rizwan](https://github.com/JavidRizwan), maintained by [Shree RSC Tutors](https://github.com/shreersctutors)

## 11. License

This project is licensed under the [MIT License](./LICENSE).
See the [Open Source Initiative page for the MIT License](https://opensource.org/licenses/MIT) for more details.

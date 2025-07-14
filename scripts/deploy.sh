#!/bin/bash
# set -e will exit the script if any command fails
set -e

# Handle script interruption
trap 'echo -e "${RED}Script interrupted.${NC}"; exit 1' INT

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process...${NC}"

# Navigate to project root (in case script is called from another directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check if AWS EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}Error: AWS Elastic Beanstalk CLI is not installed.${NC}"
    echo -e "${YELLOW}Visit: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html ${NC}"
    exit 1
fi

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    # Verify the profile exists
    if ! aws configure list --profile eb-cli &> /dev/null; then
        echo -e "${RED}Error: AWS profile 'eb-cli' not found.${NC}"
        echo -e "${YELLOW}Please run: aws configure --profile eb-cli${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: AWS CLI not found. Please install AWS CLI.${NC}"
    echo -e "${YELLOW}Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html ${NC}"
    exit 1
fi

# using 'aws configure --profile eb-cli'
echo -e "${GREEN}Using pre-configured AWS profile 'eb-cli' for deployment${NC}"


# Check git status early
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo -e "${GREEN}Git commit: $(git rev-parse --short HEAD)${NC}"
    echo -e "${GREEN}Commit message: $(git log -1 --pretty=%B)${NC}"
    
    # Check if there are any uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
        read -p "Proceed with deployment anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Deployment cancelled by user.${NC}"
            exit 1
        fi
    fi
fi

# Parse command line arguments
ENV_NAME=""
VERBOSE_FLAG=""

function show_usage {
  echo -e "${YELLOW}Usage: ./deploy.sh [--environment <name>] [--verbose]${NC}"
  echo -e "${YELLOW}  --environment, -e <name>  Specify the Elastic Beanstalk environment to deploy to${NC}"
  echo -e "${YELLOW}  --verbose, -v             Show detailed output during deployment${NC}"
  echo -e "${YELLOW}  --help, -h                Show this help message${NC}"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --environment|-e)
      if [[ -z "$2" || "$2" == --* ]]; then
        echo -e "${RED}Error: --environment requires a value${NC}"
        show_usage
      fi
      ENV_NAME="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE_FLAG="--verbose"
      shift
      ;;
    --help|-h)
      show_usage
      ;;
    --*)
      echo -e "${RED}Unknown option: $1${NC}"
      show_usage
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      show_usage
      ;;
  esac
done

# Run tests (will exit on failure due to set -e)
echo -e "${GREEN}Running tests...${NC}"
npm test

# Set a longer timeout (20 minutes) to prevent CLI timeouts
TIMEOUT="--timeout 20"

# Check if environment is specified and validate it
if [ -n "$ENV_NAME" ]; then
    # Validate that the environment exists
    if ! eb list | grep -q "$ENV_NAME"; then
        echo -e "${RED}Error: Environment '$ENV_NAME' does not exist.${NC}"
        echo -e "${YELLOW}Available environments:${NC}"
        eb list
        exit 1
    fi
    
    echo -e "${GREEN}Deploying to environment: $ENV_NAME${NC}"
    DEPLOY_COMMAND="eb deploy --environment $ENV_NAME $TIMEOUT $VERBOSE_FLAG"
else
    # When no environment is specified, eb deploy will use the default environment
    echo -e "${YELLOW}No environment specified, using default environment${NC}"
    DEPLOY_COMMAND="eb deploy $TIMEOUT $VERBOSE_FLAG"
fi

# Deploy to Elastic Beanstalk
echo -e "${GREEN}Deploying to AWS Elastic Beanstalk...${NC}"
eval $DEPLOY_COMMAND

echo -e "${GREEN}Deployment completed successfully!${NC}"

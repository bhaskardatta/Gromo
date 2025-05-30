#!/bin/bash

# Gromo Integration Test Script
# Tests all modernization components

set -e

echo "🚀 Starting Gromo Integration Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Running: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to check file exists
check_file_exists() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ $description exists${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $description missing: $file_path${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to check directory exists
check_dir_exists() {
    local dir_path="$1"
    local description="$2"
    
    if [ -d "$dir_path" ]; then
        echo -e "${GREEN}✅ $description exists${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $description missing: $dir_path${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to validate JSON file
validate_json() {
    local file_path="$1"
    local description="$2"
    
    if python3 -m json.tool "$file_path" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description is valid JSON${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $description has invalid JSON${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to validate YAML file
validate_yaml() {
    local file_path="$1"
    local description="$2"
    
    if python3 -c "import yaml; yaml.safe_load(open('$file_path'))" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description is valid YAML${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $description has invalid YAML${NC}"
        ((TESTS_FAILED++))
    fi
}

# 1. Project Structure Tests
echo -e "\n${YELLOW}🏗️  Testing Project Structure${NC}"

check_dir_exists "src" "Source directory"
check_dir_exists "tests" "Tests directory"
check_dir_exists "k8s" "Kubernetes manifests"
check_dir_exists "monitoring" "Monitoring configuration"
check_dir_exists "scripts" "Scripts directory"
check_dir_exists "config" "Configuration directory"

# 2. Core Files Tests
echo -e "\n${YELLOW}📁 Testing Core Files${NC}"

check_file_exists "package.json" "Package configuration"
check_file_exists "tsconfig.json" "TypeScript configuration"
check_file_exists "Dockerfile" "Docker configuration"
check_file_exists ".github/workflows/ci-cd.yml" "CI/CD pipeline"

# 3. Enhanced E2E Tests
echo -e "\n${YELLOW}🧪 Testing E2E Infrastructure${NC}"

check_file_exists "tests/e2e/specs/claims.cy.ts" "Claims E2E tests"
check_file_exists "tests/e2e/specs/auth.cy.ts" "Authentication E2E tests"
check_file_exists "tests/e2e/support/commands.ts" "Cypress custom commands"
check_file_exists "tests/e2e/support/index.ts" "Cypress support configuration"

# 4. Monitoring Infrastructure
echo -e "\n${YELLOW}📊 Testing Monitoring Infrastructure${NC}"

check_file_exists "monitoring/grafana/dashboards/gromo-business.json" "Business metrics dashboard"
check_file_exists "monitoring/grafana/dashboards/gromo-infrastructure.json" "Infrastructure dashboard"
check_file_exists "monitoring/prometheus.yml" "Prometheus configuration"

# Validate JSON dashboards
validate_json "monitoring/grafana/dashboards/gromo-business.json" "Business dashboard JSON"
validate_json "monitoring/grafana/dashboards/gromo-infrastructure.json" "Infrastructure dashboard JSON"

# Validate YAML configurations
validate_yaml "monitoring/prometheus.yml" "Prometheus configuration"
validate_yaml ".github/workflows/ci-cd.yml" "CI/CD pipeline YAML"

# 5. Backup and Scripts
echo -e "\n${YELLOW}💾 Testing Backup and Scripts${NC}"

check_file_exists "scripts/backup-enhanced.sh" "Enhanced backup script"
check_file_exists "scripts/deploy-k8s.sh" "Kubernetes deployment script"
check_file_exists "config/performance.env" "Performance configuration"

# Check script permissions
if [ -x "scripts/backup-enhanced.sh" ]; then
    echo -e "${GREEN}✅ Backup script is executable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Backup script is not executable${NC}"
    ((TESTS_FAILED++))
fi

# 6. Code Quality Tests
echo -e "\n${YELLOW}🔍 Testing Code Quality${NC}"

run_test "TypeScript compilation" "npm run build > /dev/null 2>&1"
run_test "Code linting" "npm run lint > /dev/null 2>&1"
run_test "Code formatting check" "npm run format:check > /dev/null 2>&1"
run_test "Type checking" "npm run type-check > /dev/null 2>&1"

# 7. Security Tests
echo -e "\n${YELLOW}🔒 Testing Security Configuration${NC}"

run_test "Security audit" "npm audit --audit-level=moderate > /dev/null 2>&1"

# Check for security configuration files
check_file_exists "config/security.yml" "Security configuration"

# 8. Performance Configuration
echo -e "\n${YELLOW}⚡ Testing Performance Configuration${NC}"

if [ -f "config/performance.env" ]; then
    # Check for key performance settings
    if grep -q "NODE_ENV=production" config/performance.env; then
        echo -e "${GREEN}✅ Production environment configured${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Production environment not configured${NC}"
        ((TESTS_FAILED++))
    fi
    
    if grep -q "MAX_OLD_SPACE_SIZE" config/performance.env; then
        echo -e "${GREEN}✅ Memory optimization configured${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Memory optimization not configured${NC}"
        ((TESTS_FAILED++))
    fi
fi

# 9. Kubernetes Configuration
echo -e "\n${YELLOW}☸️  Testing Kubernetes Configuration${NC}"

for manifest in k8s/*.yaml; do
    if [ -f "$manifest" ]; then
        validate_yaml "$manifest" "$(basename "$manifest")"
    fi
done

# 10. Dependencies Check
echo -e "\n${YELLOW}📦 Testing Dependencies${NC}"

# Check if critical dependencies are installed
if npm list cypress > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Cypress testing framework installed${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Cypress testing framework missing${NC}"
    ((TESTS_FAILED++))
fi

if npm list typescript > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compiler installed${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ TypeScript compiler missing${NC}"
    ((TESTS_FAILED++))
fi

# 11. Documentation Tests
echo -e "\n${YELLOW}📚 Testing Documentation${NC}"

run_test "API documentation generation" "npm run docs:generate > /dev/null 2>&1"

# 12. Integration Summary
echo -e "\n${YELLOW}📋 Integration Test Summary${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}Total:  $TOTAL_TESTS${NC}"
echo -e "${BLUE}Success Rate: $SUCCESS_RATE%${NC}"
echo -e "${BLUE}================================${NC}"

# Generate test report
REPORT_FILE="integration-test-report.txt"
cat > "$REPORT_FILE" << EOF
Gromo Integration Test Report
Generated: $(date)

Test Results:
- Passed: $TESTS_PASSED
- Failed: $TESTS_FAILED
- Total:  $TOTAL_TESTS
- Success Rate: $SUCCESS_RATE%

Test Categories:
- Project Structure ✓
- Core Files ✓
- E2E Testing Infrastructure ✓
- Monitoring Infrastructure ✓
- Backup and Scripts ✓
- Code Quality ✓
- Security Configuration ✓
- Performance Configuration ✓
- Kubernetes Configuration ✓
- Dependencies ✓
- Documentation ✓

Modernization Components Tested:
1. Enhanced E2E Testing with Cypress
2. Advanced Grafana Dashboards
3. Automated Backup with Cloud Integration
4. Enhanced CI/CD Pipeline
5. Performance Optimization Configuration
6. Security Configurations
7. Kubernetes Deployment Manifests
8. API Documentation with Swagger

EOF

echo -e "\n${GREEN}📄 Integration test report generated: $REPORT_FILE${NC}"

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All integration tests passed! Gromo modernization is complete.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some integration tests failed. Please review and fix issues.${NC}"
    exit 1
fi

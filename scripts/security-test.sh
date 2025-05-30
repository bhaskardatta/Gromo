#!/bin/bash

# OWASP ZAP Security Testing Script
set -e

echo "🔒 Starting OWASP ZAP Security Testing..."

# Configuration
TARGET_URL="${1:-http://localhost:3000}"
REPORT_DIR="./security-reports"
ZAP_DOCKER_IMAGE="owasp/zap2docker-stable"

# Create reports directory
mkdir -p $REPORT_DIR

echo "🎯 Target URL: $TARGET_URL"
echo "📁 Reports will be saved to: $REPORT_DIR"

# Function to run ZAP baseline scan
run_baseline_scan() {
    echo "🔍 Running ZAP Baseline Scan..."
    
    docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
        -t $ZAP_DOCKER_IMAGE \
        zap-baseline.py \
        -t $TARGET_URL \
        -g gen.conf \
        -r baseline-report.html \
        -x baseline-report.xml \
        -J baseline-report.json || true
    
    echo "✅ Baseline scan completed"
}

# Function to run ZAP full scan
run_full_scan() {
    echo "🔍 Running ZAP Full Scan..."
    
    docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
        -t $ZAP_DOCKER_IMAGE \
        zap-full-scan.py \
        -t $TARGET_URL \
        -g gen.conf \
        -r full-scan-report.html \
        -x full-scan-report.xml \
        -J full-scan-report.json || true
    
    echo "✅ Full scan completed"
}

# Function to run ZAP API scan
run_api_scan() {
    echo "🔍 Running ZAP API Scan..."
    
    # Create OpenAPI spec URL
    API_SPEC_URL="$TARGET_URL/api-docs"
    
    docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
        -t $ZAP_DOCKER_IMAGE \
        zap-api-scan.py \
        -t $API_SPEC_URL \
        -f openapi \
        -r api-scan-report.html \
        -x api-scan-report.xml \
        -J api-scan-report.json || true
    
    echo "✅ API scan completed"
}

# Function to generate summary report
generate_summary() {
    echo "📊 Generating Security Summary Report..."
    
    cat > $REPORT_DIR/security-summary.md << EOF
# Gromo Security Testing Report

**Generated:** $(date)
**Target:** $TARGET_URL

## Test Summary

### Baseline Scan
- **Status:** $([ -f $REPORT_DIR/baseline-report.json ] && echo "✅ Completed" || echo "❌ Failed")
- **Report:** [baseline-report.html](./baseline-report.html)

### Full Scan
- **Status:** $([ -f $REPORT_DIR/full-scan-report.json ] && echo "✅ Completed" || echo "❌ Failed")
- **Report:** [full-scan-report.html](./full-scan-report.html)

### API Scan
- **Status:** $([ -f $REPORT_DIR/api-scan-report.json ] && echo "✅ Completed" || echo "❌ Failed")
- **Report:** [api-scan-report.html](./api-scan-report.html)

## Security Recommendations

### High Priority
- Ensure all endpoints require authentication
- Implement proper CORS policies
- Use HTTPS in production
- Validate all input parameters
- Implement rate limiting

### Medium Priority
- Add security headers (CSP, HSTS, etc.)
- Implement proper session management
- Use secure cookie settings
- Add input sanitization
- Implement proper error handling

### Low Priority
- Regular security dependency updates
- Security monitoring and logging
- Penetration testing schedule
- Security awareness training

## Next Steps

1. Review all generated reports
2. Address high-priority vulnerabilities first
3. Implement security controls
4. Re-run tests to verify fixes
5. Schedule regular security testing

EOF

    echo "✅ Security summary generated"
}

# Function to check prerequisites
check_prerequisites() {
    echo "🔧 Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Function to wait for target availability
wait_for_target() {
    echo "⏳ Waiting for target to be available..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" $TARGET_URL | grep -q "200\|404\|401\|403"; then
            echo "✅ Target is available"
            return 0
        fi
        
        echo "⏳ Attempt $attempt/$max_attempts - Target not available yet..."
        sleep 10
        ((attempt++))
    done
    
    echo "❌ Target is not available after $max_attempts attempts"
    exit 1
}

# Main execution
echo "🚀 Starting security testing workflow..."

check_prerequisites
wait_for_target

echo "🔍 Running security scans..."
run_baseline_scan

# Only run full scan if baseline passed
if [ -f "$REPORT_DIR/baseline-report.json" ]; then
    run_full_scan
fi

# Run API scan
run_api_scan

# Generate summary
generate_summary

echo ""
echo "🎉 Security testing completed!"
echo "📁 Reports available in: $REPORT_DIR"
echo "📊 View summary: $REPORT_DIR/security-summary.md"

# Display results
if [ -f "$REPORT_DIR/security-summary.md" ]; then
    echo ""
    echo "📋 Security Testing Summary:"
    cat $REPORT_DIR/security-summary.md | grep -A 10 "## Test Summary"
fi

echo ""
echo "🔒 Remember to:"
echo "  1. Review all generated reports"
echo "  2. Address critical vulnerabilities immediately"
echo "  3. Re-run tests after fixes"
echo "  4. Schedule regular security testing"

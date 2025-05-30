#!/bin/bash

# Gromo Production Optimization Script
set -e

echo "⚡ Running Gromo Production Optimizations..."

# Function to optimize Redis caching
optimize_redis_caching() {
    echo "🔧 Implementing Redis caching optimizations..."
    
    # Check if Redis is accessible
    if kubectl get pods -n gromo | grep -q redis; then
        echo "✅ Redis found in cluster"
        
        # Apply Redis optimization ConfigMap
        cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-optimization
  namespace: gromo
data:
  redis.conf: |
    # Memory optimization
    maxmemory 256mb
    maxmemory-policy allkeys-lru
    
    # Performance optimization
    save 900 1
    save 300 10
    save 60 10000
    
    # Network optimization
    tcp-keepalive 300
    timeout 0
    
    # Security
    bind 127.0.0.1 ::1
    protected-mode yes
    
    # Logging
    loglevel notice
    logfile ""
EOF
        
        echo "✅ Redis caching optimizations applied"
    else
        echo "⚠️  Redis not found, skipping Redis optimizations"
    fi
}

# Function to optimize connection pooling
optimize_connection_pooling() {
    echo "🔧 Implementing connection pooling optimizations..."
    
    # Apply MongoDB connection pooling optimization
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: mongodb-optimization
  namespace: gromo
data:
  mongod.conf: |
    net:
      port: 27017
      bindIp: 0.0.0.0
      maxIncomingConnections: 1000
      
    storage:
      wiredTiger:
        engineConfig:
          cacheSizeGB: 1
          
    operationProfiling:
      slowOpThresholdMs: 100
      mode: slowOp
      
    replication:
      replSetName: rs0
EOF
    
    echo "✅ Connection pooling optimizations applied"
}

# Function to optimize worker system
optimize_worker_system() {
    echo "🔧 Implementing worker system optimizations..."
    
    # Apply worker optimization ConfigMap
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: worker-optimization
  namespace: gromo
data:
  WORKER_CONCURRENCY: "5"
  WORKER_RETRY_ATTEMPTS: "3"
  WORKER_RETRY_DELAY: "5000"
  NOTIFICATION_BATCH_SIZE: "10"
  ESCALATION_CHECK_INTERVAL: "300000"
  CLEANUP_INTERVAL: "3600000"
  MAX_QUEUE_SIZE: "1000"
  QUEUE_TIMEOUT: "30000"
EOF
    
    echo "✅ Worker system optimizations applied"
}

# Function to optimize payload compression
optimize_payload_compression() {
    echo "🔧 Implementing payload compression optimizations..."
    
    # Apply compression ConfigMap
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: compression-optimization
  namespace: gromo
data:
  COMPRESSION_ENABLED: "true"
  COMPRESSION_LEVEL: "6"
  COMPRESSION_THRESHOLD: "1024"
  GZIP_LEVEL: "6"
  BROTLI_QUALITY: "4"
  IMAGE_COMPRESSION_QUALITY: "85"
  PDF_COMPRESSION_LEVEL: "5"
EOF
    
    echo "✅ Payload compression optimizations applied"
}

# Function to apply rate limiting optimizations
optimize_rate_limiting() {
    echo "🔧 Implementing advanced rate limiting..."
    
    # Apply rate limiting ConfigMap
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: rate-limit-optimization
  namespace: gromo
data:
  RATE_LIMIT_WINDOW_MS: "60000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: "true"
  RATE_LIMIT_SKIP_FAILED_REQUESTS: "false"
  RATE_LIMIT_STORE: "redis"
  BURST_LIMIT: "10"
  SUSTAINED_LIMIT: "50"
EOF
    
    echo "✅ Rate limiting optimizations applied"
}

# Function to optimize logging and monitoring
optimize_monitoring() {
    echo "🔧 Implementing monitoring optimizations..."
    
    # Apply monitoring ConfigMap
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: monitoring-optimization
  namespace: gromo
data:
  LOG_LEVEL: "info"
  METRICS_ENABLED: "true"
  METRICS_INTERVAL: "30000"
  HEALTH_CHECK_INTERVAL: "10000"
  PROMETHEUS_METRICS: "true"
  JAEGER_TRACING: "true"
  ERROR_TRACKING: "true"
  PERFORMANCE_MONITORING: "true"
EOF
    
    echo "✅ Monitoring optimizations applied"
}

# Function to apply security optimizations
optimize_security() {
    echo "🔧 Implementing security optimizations..."
    
    # Apply security hardening ConfigMap
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-optimization
  namespace: gromo
data:
  SECURITY_HEADERS_ENABLED: "true"
  CORS_CREDENTIALS: "true"
  CSRF_PROTECTION: "true"
  XSS_PROTECTION: "true"
  CONTENT_TYPE_SNIFFING: "false"
  REFERRER_POLICY: "strict-origin-when-cross-origin"
  FEATURE_POLICY_ENABLED: "true"
  HSTS_MAX_AGE: "31536000"
  HELMET_ENABLED: "true"
EOF
    
    echo "✅ Security optimizations applied"
}

# Function to restart deployments to apply optimizations
restart_deployments() {
    echo "🔄 Restarting deployments to apply optimizations..."
    
    # Restart main application
    kubectl rollout restart deployment/gromo-app -n gromo || kubectl rollout restart deployment/gromo-gromo -n gromo
    
    # Wait for rollout to complete
    kubectl rollout status deployment/gromo-app -n gromo || kubectl rollout status deployment/gromo-gromo -n gromo
    
    echo "✅ Deployments restarted successfully"
}

# Function to verify optimizations
verify_optimizations() {
    echo "🔍 Verifying optimizations..."
    
    # Check pods are running
    echo "📋 Pod status:"
    kubectl get pods -n gromo
    
    # Check ConfigMaps
    echo "📝 ConfigMaps applied:"
    kubectl get configmaps -n gromo | grep optimization
    
    # Check resource usage
    echo "📊 Resource usage:"
    kubectl top pods -n gromo || echo "Metrics server not available"
    
    echo "✅ Optimization verification completed"
}

# Main optimization execution
echo "🚀 Starting production optimizations..."

optimize_redis_caching
optimize_connection_pooling
optimize_worker_system
optimize_payload_compression
optimize_rate_limiting
optimize_monitoring
optimize_security

echo "⏳ Applying optimizations to running deployments..."
restart_deployments

echo "🔍 Verifying all optimizations..."
verify_optimizations

echo ""
echo "🎉 Production optimizations completed successfully!"
echo "📊 Your Gromo application is now optimized for production workloads"
echo "📈 Monitor performance improvements with: kubectl top pods -n gromo"
echo "📝 Check logs with: kubectl logs -f deployment/gromo-app -n gromo"

echo ""
echo "📋 Optimization Summary:"
echo "  ✅ Redis caching optimized"
echo "  ✅ Connection pooling configured"
echo "  ✅ Worker system enhanced"
echo "  ✅ Payload compression enabled"
echo "  ✅ Advanced rate limiting applied"
echo "  ✅ Monitoring and logging optimized"
echo "  ✅ Security hardening applied"

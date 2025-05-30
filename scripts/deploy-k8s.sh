#!/bin/bash

# Gromo Kubernetes Deployment Script
set -e

echo "🚀 Starting Gromo Kubernetes Deployment..."

# Configuration
NAMESPACE="gromo"
RELEASE_NAME="gromo"
CHART_PATH="./helm/gromo"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if helm is available
if ! command -v helm &> /dev/null; then
    echo "❌ Helm is not installed. Please install Helm first."
    exit 1
fi

# Function to wait for deployment
wait_for_deployment() {
    local deployment_name=$1
    local namespace=$2
    echo "⏳ Waiting for deployment $deployment_name to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/$deployment_name -n $namespace
}

# Function to check if namespace exists
check_namespace() {
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        echo "📦 Creating namespace $NAMESPACE..."
        kubectl create namespace $NAMESPACE
    else
        echo "✅ Namespace $NAMESPACE already exists"
    fi
}

# Function to apply kubernetes manifests
deploy_with_kubectl() {
    echo "📝 Deploying with kubectl..."
    
    check_namespace
    
    echo "🔧 Applying Kubernetes manifests..."
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/rbac.yaml
    kubectl apply -f k8s/mongodb.yaml
    kubectl apply -f k8s/redis.yaml
    
    echo "⏳ Waiting for MongoDB and Redis to be ready..."
    sleep 30
    
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/hpa.yaml
    
    wait_for_deployment "gromo-app" $NAMESPACE
    wait_for_deployment "mongodb" $NAMESPACE
    wait_for_deployment "redis" $NAMESPACE
}

# Function to deploy with Helm
deploy_with_helm() {
    echo "📝 Deploying with Helm..."
    
    # Add required repositories
    echo "📦 Adding Helm repositories..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    # Check if release exists
    if helm list -n $NAMESPACE | grep -q $RELEASE_NAME; then
        echo "🔄 Upgrading existing Helm release..."
        helm upgrade $RELEASE_NAME $CHART_PATH -n $NAMESPACE --create-namespace
    else
        echo "🆕 Installing new Helm release..."
        helm install $RELEASE_NAME $CHART_PATH -n $NAMESPACE --create-namespace
    fi
    
    # Wait for deployment
    wait_for_deployment "${RELEASE_NAME}-gromo" $NAMESPACE
}

# Function to verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Check pods
    echo "📋 Pod status:"
    kubectl get pods -n $NAMESPACE
    
    # Check services
    echo "🌐 Service status:"
    kubectl get services -n $NAMESPACE
    
    # Check ingress
    echo "🔗 Ingress status:"
    kubectl get ingress -n $NAMESPACE || echo "No ingress found"
    
    # Check HPA
    echo "📊 HPA status:"
    kubectl get hpa -n $NAMESPACE || echo "No HPA found"
}

# Function to get access information
get_access_info() {
    echo "🔗 Getting access information..."
    
    # Get LoadBalancer IP
    echo "📍 LoadBalancer information:"
    kubectl get service gromo-service -n $NAMESPACE -o wide || kubectl get service ${RELEASE_NAME}-gromo -n $NAMESPACE -o wide
    
    # Get ingress information
    echo "🌍 Ingress information:"
    kubectl get ingress -n $NAMESPACE || echo "No ingress configured"
    
    echo ""
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your Gromo application should be accessible via the LoadBalancer IP or Ingress URL"
    echo "📊 Monitor your deployment with: kubectl get pods -n $NAMESPACE -w"
}

# Main deployment logic
case "${1:-helm}" in
    "kubectl"|"k8s")
        deploy_with_kubectl
        ;;
    "helm")
        deploy_with_helm
        ;;
    *)
        echo "Usage: $0 [kubectl|helm]"
        echo "  kubectl: Deploy using raw Kubernetes manifests"
        echo "  helm:    Deploy using Helm chart (default)"
        exit 1
        ;;
esac

verify_deployment
get_access_info

echo ""
echo "🎉 Gromo deployment script completed!"
echo "📚 Check the README.md for post-deployment configuration steps"

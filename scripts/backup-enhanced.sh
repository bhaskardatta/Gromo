#!/bin/bash

# Enhanced Backup Script for Gromo Application
# Supports multiple backup strategies and cloud storage integration

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${SCRIPT_DIR}/backup-config.env"

# Load configuration
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
else
    echo "Creating default backup configuration..."
    cat > "$CONFIG_FILE" << 'EOF'
# Backup Configuration
BACKUP_ROOT_DIR="/tmp/gromo-backups"
MONGODB_HOST="localhost"
MONGODB_PORT="27017"
MONGODB_DB="gromo"
REDIS_HOST="localhost"
REDIS_PORT="6379"
RETENTION_DAYS="30"
COMPRESS_BACKUPS="true"
ENCRYPT_BACKUPS="false"
BACKUP_PASSWORD=""
AWS_S3_BUCKET=""
AZURE_STORAGE_ACCOUNT=""
AZURE_CONTAINER=""
GCP_BUCKET=""
BACKUP_TYPE="local"  # local, s3, azure, gcp
NOTIFICATION_WEBHOOK=""
BACKUP_THREADS="4"
EOF
    source "$CONFIG_FILE"
fi

# Logging setup
LOG_DIR="${BACKUP_ROOT_DIR}/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/backup-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

# Notification function
notify() {
    local status="$1"
    local message="$2"
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
}

# Backup verification function
verify_backup() {
    local backup_file="$1"
    local backup_type="$2"
    
    log "Verifying backup: $backup_file"
    
    case "$backup_type" in
        "mongodb")
            if command -v mongorestore >/dev/null 2>&1; then
                mongorestore --dry-run --gzip --archive="$backup_file" >/dev/null 2>&1
                return $?
            fi
            ;;
        "redis")
            if command -v redis-check-rdb >/dev/null 2>&1; then
                redis-check-rdb "$backup_file" >/dev/null 2>&1
                return $?
            fi
            ;;
    esac
    
    # Basic file integrity check
    if [[ "$COMPRESS_BACKUPS" == "true" ]] && [[ "$backup_file" == *.gz ]]; then
        gzip -t "$backup_file"
        return $?
    fi
    
    [[ -s "$backup_file" ]]
}

# MongoDB backup function
backup_mongodb() {
    local timestamp="$1"
    local backup_dir="$2"
    
    log "Starting MongoDB backup..."
    
    local mongo_backup_file="${backup_dir}/mongodb-${timestamp}"
    
    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        mongo_backup_file="${mongo_backup_file}.gz"
        mongodump --host "$MONGODB_HOST:$MONGODB_PORT" --db "$MONGODB_DB" \
                  --gzip --archive="$mongo_backup_file" \
                  --numParallelCollections "$BACKUP_THREADS"
    else
        mongodump --host "$MONGODB_HOST:$MONGODB_PORT" --db "$MONGODB_DB" \
                  --archive="$mongo_backup_file" \
                  --numParallelCollections "$BACKUP_THREADS"
    fi
    
    if verify_backup "$mongo_backup_file" "mongodb"; then
        log "MongoDB backup completed successfully: $mongo_backup_file"
        
        # Generate metadata
        local metadata_file="${mongo_backup_file}.metadata"
        cat > "$metadata_file" << EOF
{
    "backup_type": "mongodb",
    "database": "$MONGODB_DB",
    "timestamp": "$timestamp",
    "file_size": $(stat -f%z "$mongo_backup_file" 2>/dev/null || stat -c%s "$mongo_backup_file"),
    "compressed": $COMPRESS_BACKUPS,
    "host": "$MONGODB_HOST:$MONGODB_PORT",
    "collections": $(mongo "$MONGODB_HOST:$MONGODB_PORT/$MONGODB_DB" --quiet --eval "db.getCollectionNames().length")
}
EOF
        
        return 0
    else
        error "MongoDB backup verification failed"
        return 1
    fi
}

# Redis backup function
backup_redis() {
    local timestamp="$1"
    local backup_dir="$2"
    
    log "Starting Redis backup..."
    
    local redis_backup_file="${backup_dir}/redis-${timestamp}.rdb"
    
    # Use BGSAVE for non-blocking backup
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGSAVE
    
    # Wait for background save to complete
    while [[ $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO persistence | grep rdb_bgsave_in_progress:1) ]]; do
        log "Waiting for Redis background save to complete..."
        sleep 2
    done
    
    # Copy the RDB file
    local redis_data_dir=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET dir | tail -n1)
    local redis_rdb_file=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET dbfilename | tail -n1)
    
    cp "${redis_data_dir}/${redis_rdb_file}" "$redis_backup_file"
    
    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        gzip "$redis_backup_file"
        redis_backup_file="${redis_backup_file}.gz"
    fi
    
    if verify_backup "$redis_backup_file" "redis"; then
        log "Redis backup completed successfully: $redis_backup_file"
        
        # Generate metadata
        local metadata_file="${redis_backup_file}.metadata"
        cat > "$metadata_file" << EOF
{
    "backup_type": "redis",
    "timestamp": "$timestamp",
    "file_size": $(stat -f%z "$redis_backup_file" 2>/dev/null || stat -c%s "$redis_backup_file"),
    "compressed": $COMPRESS_BACKUPS,
    "host": "$REDIS_HOST:$REDIS_PORT",
    "keys_count": $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DBSIZE)
}
EOF
        
        return 0
    else
        error "Redis backup verification failed"
        return 1
    fi
}

# Application data backup function
backup_application_data() {
    local timestamp="$1"
    local backup_dir="$2"
    
    log "Starting application data backup..."
    
    local app_backup_file="${backup_dir}/app-data-${timestamp}.tar"
    
    # Backup important application directories
    local backup_paths=(
        "${PROJECT_ROOT}/uploads"
        "${PROJECT_ROOT}/logs"
        "${PROJECT_ROOT}/config"
        "${PROJECT_ROOT}/.env"
    )
    
    # Create tar archive of existing paths
    local existing_paths=()
    for path in "${backup_paths[@]}"; do
        if [[ -e "$path" ]]; then
            existing_paths+=("$path")
        fi
    done
    
    if [[ ${#existing_paths[@]} -gt 0 ]]; then
        tar -cf "$app_backup_file" -C "$PROJECT_ROOT" \
            $(printf '%s\n' "${existing_paths[@]}" | sed "s|${PROJECT_ROOT}/||g")
        
        if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
            gzip "$app_backup_file"
            app_backup_file="${app_backup_file}.gz"
        fi
        
        log "Application data backup completed: $app_backup_file"
        
        # Generate metadata
        local metadata_file="${app_backup_file}.metadata"
        cat > "$metadata_file" << EOF
{
    "backup_type": "application_data",
    "timestamp": "$timestamp",
    "file_size": $(stat -f%z "$app_backup_file" 2>/dev/null || stat -c%s "$app_backup_file"),
    "compressed": $COMPRESS_BACKUPS,
    "paths": $(printf '%s\n' "${existing_paths[@]}" | jq -R . | jq -s .)
}
EOF
        
        return 0
    else
        log "No application data found to backup"
        return 0
    fi
}

# Encryption function
encrypt_file() {
    local file="$1"
    
    if [[ "$ENCRYPT_BACKUPS" == "true" ]] && [[ -n "$BACKUP_PASSWORD" ]]; then
        log "Encrypting backup: $file"
        openssl enc -aes-256-cbc -salt -in "$file" -out "${file}.enc" -pass pass:"$BACKUP_PASSWORD"
        rm "$file"
        mv "${file}.enc" "$file"
    fi
}

# Cloud upload functions
upload_to_s3() {
    local file="$1"
    local s3_key="gromo-backups/$(basename "$file")"
    
    log "Uploading to S3: s3://${AWS_S3_BUCKET}/${s3_key}"
    aws s3 cp "$file" "s3://${AWS_S3_BUCKET}/${s3_key}" --storage-class STANDARD_IA
}

upload_to_azure() {
    local file="$1"
    local blob_name="gromo-backups/$(basename "$file")"
    
    log "Uploading to Azure: ${AZURE_STORAGE_ACCOUNT}/${AZURE_CONTAINER}/${blob_name}"
    az storage blob upload --account-name "$AZURE_STORAGE_ACCOUNT" \
                          --container-name "$AZURE_CONTAINER" \
                          --name "$blob_name" \
                          --file "$file" \
                          --tier Cool
}

upload_to_gcp() {
    local file="$1"
    local object_name="gromo-backups/$(basename "$file")"
    
    log "Uploading to GCP: gs://${GCP_BUCKET}/${object_name}"
    gsutil cp "$file" "gs://${GCP_BUCKET}/${object_name}"
}

# Upload backup to cloud storage
upload_backup() {
    local backup_dir="$1"
    
    if [[ "$BACKUP_TYPE" == "local" ]]; then
        log "Local backup configured, skipping cloud upload"
        return 0
    fi
    
    log "Uploading backups to cloud storage ($BACKUP_TYPE)..."
    
    for file in "$backup_dir"/*; do
        if [[ -f "$file" ]]; then
            case "$BACKUP_TYPE" in
                "s3")
                    upload_to_s3 "$file"
                    ;;
                "azure")
                    upload_to_azure "$file"
                    ;;
                "gcp")
                    upload_to_gcp "$file"
                    ;;
                *)
                    error "Unknown backup type: $BACKUP_TYPE"
                    return 1
                    ;;
            esac
        fi
    done
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_ROOT_DIR" -type f -name "*.gz" -o -name "*.rdb" -o -name "*.tar" \
        | while read -r file; do
            if [[ $(find "$file" -mtime +$RETENTION_DAYS 2>/dev/null) ]]; then
                log "Removing old backup: $file"
                rm -f "$file" "${file}.metadata"
            fi
        done
}

# Health check function
health_check() {
    log "Performing health checks..."
    
    # Check MongoDB connectivity
    if ! mongosh --host "$MONGODB_HOST:$MONGODB_PORT" --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        error "MongoDB health check failed"
        return 1
    fi
    
    # Check Redis connectivity
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
        error "Redis health check failed"
        return 1
    fi
    
    log "Health checks passed"
    return 0
}

# Main backup function
main() {
    local start_time=$(date +%s)
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_dir="${BACKUP_ROOT_DIR}/${timestamp}"
    
    log "=== Starting Gromo Backup Process ==="
    log "Timestamp: $timestamp"
    log "Backup directory: $backup_dir"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Perform health checks
    if ! health_check; then
        error "Health checks failed, aborting backup"
        notify "error" "Backup failed: Health checks failed"
        exit 1
    fi
    
    local backup_status="success"
    local failed_components=()
    
    # Backup MongoDB
    if ! backup_mongodb "$timestamp" "$backup_dir"; then
        backup_status="partial"
        failed_components+=("MongoDB")
    fi
    
    # Backup Redis
    if ! backup_redis "$timestamp" "$backup_dir"; then
        backup_status="partial"
        failed_components+=("Redis")
    fi
    
    # Backup application data
    if ! backup_application_data "$timestamp" "$backup_dir"; then
        backup_status="partial"
        failed_components+=("Application Data")
    fi
    
    # Encrypt backups if configured
    if [[ "$ENCRYPT_BACKUPS" == "true" ]]; then
        for file in "$backup_dir"/*; do
            if [[ -f "$file" ]] && [[ "$file" != *.metadata ]]; then
                encrypt_file "$file"
            fi
        done
    fi
    
    # Upload to cloud storage
    if ! upload_backup "$backup_dir"; then
        backup_status="partial"
        failed_components+=("Cloud Upload")
    fi
    
    # Generate backup summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local total_size=$(du -sh "$backup_dir" | cut -f1)
    
    local summary_file="${backup_dir}/backup-summary.json"
    cat > "$summary_file" << EOF
{
    "timestamp": "$timestamp",
    "status": "$backup_status",
    "duration_seconds": $duration,
    "total_size": "$total_size",
    "backup_type": "$BACKUP_TYPE",
    "components": {
        "mongodb": $([ -f "${backup_dir}/mongodb-${timestamp}"* ] && echo "true" || echo "false"),
        "redis": $([ -f "${backup_dir}/redis-${timestamp}"* ] && echo "true" || echo "false"),
        "application_data": $([ -f "${backup_dir}/app-data-${timestamp}"* ] && echo "true" || echo "false")
    },
    "failed_components": $(printf '%s\n' "${failed_components[@]}" 2>/dev/null | jq -R . | jq -s . || echo "[]"),
    "compressed": $COMPRESS_BACKUPS,
    "encrypted": $ENCRYPT_BACKUPS
}
EOF
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send notification
    if [[ "$backup_status" == "success" ]]; then
        log "=== Backup completed successfully ==="
        notify "success" "Backup completed successfully in ${duration}s. Size: $total_size"
    else
        log "=== Backup completed with issues ==="
        notify "warning" "Backup completed with issues. Failed: ${failed_components[*]}"
    fi
    
    log "Backup summary: $summary_file"
    log "Duration: ${duration} seconds"
    log "Total size: $total_size"
}

# Script execution
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        echo "Restore functionality not implemented yet"
        exit 1
        ;;
    "test")
        health_check
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|test|cleanup}"
        exit 1
        ;;
esac

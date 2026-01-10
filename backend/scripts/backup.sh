#!/bin/bash
# SikaRemit Database Backup Script
# Run daily via cron: 0 2 * * * /path/to/backup.sh
# Or use Windows Task Scheduler for Windows servers

set -e

# Configuration from environment
DB_NAME="${DB_NAME:-sikaremit_prod}"
DB_USER="${DB_USER:-sikaremit_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sikaremit}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"

echo "=========================================="
echo "SikaRemit Database Backup"
echo "Started: $(date)"
echo "=========================================="

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Create backup
echo "Creating backup of ${DB_NAME}..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -Fc \
    --no-owner \
    --no-acl \
    "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✓ Backup created successfully: ${BACKUP_FILE}"
    echo "  Size: ${BACKUP_SIZE}"
else
    echo "✗ ERROR: Backup failed!"
    exit 1
fi

# Remove old backups
echo "Removing backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "  Deleted ${DELETED_COUNT} old backup(s)"

# Optional: Upload to S3
if [ -n "${BACKUP_S3_BUCKET}" ]; then
    echo "Uploading to S3..."
    aws s3 cp "${BACKUP_FILE}" "s3://${BACKUP_S3_BUCKET}/backups/" --storage-class STANDARD_IA
    if [ $? -eq 0 ]; then
        echo "✓ Uploaded to S3 successfully"
    else
        echo "✗ S3 upload failed"
    fi
fi

# Optional: Send notification
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✓ SikaRemit backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})\"}" \
        "${SLACK_WEBHOOK_URL}"
fi

echo "=========================================="
echo "Backup completed: $(date)"
echo "=========================================="

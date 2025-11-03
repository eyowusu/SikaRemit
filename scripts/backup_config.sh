#!/bin/bash
# Versioned configuration backup with failure alerts
VERSION=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="config_backups/${VERSION}"
LOG_FILE="logs/backup_${VERSION}.log"

mkdir -p "$BACKUP_DIR"
mkdir -p logs

echo "Starting backup ${VERSION}" > "$LOG_FILE"

# Backup files
cp .env "$BACKUP_DIR" 2>> "$LOG_FILE" || FAILED=true
cp backend/core/alerts.py "$BACKUP_DIR" 2>> "$LOG_FILE" || FAILED=true
cp backend/core/settings.py "$BACKUP_DIR" 2>> "$LOG_FILE" || FAILED=true

if [ "$FAILED" = true ]; then
    echo "Backup failed - see ${LOG_FILE}" >&2
    python manage.py shell -c "from core.alerts import send_to_slack; send_to_slack('Backup failed: check ${LOG_FILE}')"
    exit 1
fi

# Create version manifest
echo "# PayGlobe Config Version ${VERSION}" > "$BACKUP_DIR/VERSION.md"
echo "Backup created: $(date)" >> "$BACKUP_DIR/VERSION.md"
git rev-parse HEAD >> "$BACKUP_DIR/VERSION.md" 2>/dev/null || echo "No git commit" >> "$BACKUP_DIR/VERSION.md"

# Complete backup
zip -r "config_backups/payglobe_config_${VERSION}.zip" "$BACKUP_DIR" >> "$LOG_FILE" 2>&1 || {
    python manage.py shell -c "from core.alerts import send_to_slack; send_to_slack('Backup archiving failed')"
    exit 1
}

echo "Version ${VERSION} backed up successfully"

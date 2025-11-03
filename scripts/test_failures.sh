#!/bin/bash
# Test backup failure scenarios with cleanup
trap cleanup EXIT ERR

cleanup() {
    echo "Restoring original state..."
    [ -f .env.bak ] && mv .env.bak .env
    [ -f dummy_file ] && rm dummy_file
    chmod 644 backend/core/settings.py
}

# Scenario 1: Missing critical files
mv .env .env.bak
./scripts/backup_config.sh
mv .env.bak .env

# Scenario 2: Disk full
touch dummy_file
fallocate -l 10G dummy_file
./scripts/backup_config.sh
rm dummy_file

# Scenario 3: Permission issues
chmod 000 backend/core/settings.py
./scripts/backup_config.sh
chmod 644 backend/core/settings.py

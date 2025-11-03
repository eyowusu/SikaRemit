#!/bin/bash
# Add daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * cd $PWD && ./scripts/backup_config.sh") | crontab -
echo "Daily 2AM backups scheduled"

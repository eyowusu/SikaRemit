#!/bin/bash
# Runs payment monitoring every 30 minutes

cd /path/to/your/project
source venv/bin/activate

export DJANGO_SETTINGS_MODULE="core.settings"
python -c "
from payments.monitoring import PaymentMonitor
import json
result = {
    'health_check': PaymentMonitor.check_paystack_health(),
    'audit': PaymentMonitor.audit_credentials()
}
print(json.dumps(result, indent=2))
" > /var/log/payment_monitor.log 2>&1

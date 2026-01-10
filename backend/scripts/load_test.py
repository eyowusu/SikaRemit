"""
Load Testing Script for SikaRemit API
Uses locust for performance benchmarking
Run with: locust -f load_test.py --host=http://localhost:8000
"""
import os
import sys
import random
import json
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class SikaRemitUser(HttpUser):
    """Simulates a typical SikaRemit user"""
    
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    
    def on_start(self):
        """Login when user starts"""
        self.token = None
        self.login()
    
    def login(self):
        """Authenticate and get JWT token"""
        response = self.client.post('/api/v1/accounts/login/', json={
            'email': 'loadtest@example.com',
            'password': 'LoadTest123!',
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access')
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
        else:
            # Create test user if doesn't exist
            self.client.post('/api/v1/accounts/register/', json={
                'email': 'loadtest@example.com',
                'password': 'LoadTest123!',
                'password_confirm': 'LoadTest123!',
                'first_name': 'Load',
                'last_name': 'Test',
                'phone_number': f'+23324{random.randint(1000000, 9999999)}',
            })
            # Try login again
            response = self.client.post('/api/v1/accounts/login/', json={
                'email': 'loadtest@example.com',
                'password': 'LoadTest123!',
            })
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                self.client.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
    
    @task(10)
    def get_dashboard(self):
        """Get dashboard stats - most common operation"""
        self.client.get('/api/v1/dashboard/stats/')
    
    @task(8)
    def get_wallets(self):
        """Get user wallets"""
        self.client.get('/api/v1/payments/wallet/')
    
    @task(8)
    def get_transactions(self):
        """Get transaction history"""
        self.client.get('/api/v1/payments/transactions/')
    
    @task(5)
    def get_exchange_rates(self):
        """Get exchange rates"""
        self.client.get('/api/v1/payments/exchange-rates/')
    
    @task(3)
    def get_payment_methods(self):
        """Get payment methods"""
        self.client.get('/api/v1/payments/methods/')
    
    @task(2)
    def get_notifications(self):
        """Get notifications"""
        self.client.get('/api/v1/notifications/')
    
    @task(1)
    def get_profile(self):
        """Get user profile"""
        self.client.get('/api/v1/accounts/profile/')


class MerchantUser(HttpUser):
    """Simulates a merchant user"""
    
    wait_time = between(2, 8)
    
    def on_start(self):
        """Login as merchant"""
        self.token = None
        response = self.client.post('/api/v1/accounts/login/', json={
            'email': 'merchant_loadtest@example.com',
            'password': 'MerchantTest123!',
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access')
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
    
    @task(10)
    def get_merchant_dashboard(self):
        """Get merchant dashboard"""
        self.client.get('/api/v1/merchants/dashboard/')
    
    @task(8)
    def get_merchant_transactions(self):
        """Get merchant transactions"""
        self.client.get('/api/v1/merchants/transactions/')
    
    @task(5)
    def get_pos_devices(self):
        """Get POS devices"""
        self.client.get('/api/v1/payments/pos/devices/')
    
    @task(3)
    def get_pos_dashboard(self):
        """Get POS dashboard"""
        self.client.get('/api/v1/payments/pos/dashboard/')


class AdminUser(HttpUser):
    """Simulates an admin user"""
    
    wait_time = between(3, 10)
    weight = 1  # Less common than regular users
    
    def on_start(self):
        """Login as admin"""
        self.token = None
        response = self.client.post('/api/v1/accounts/login/', json={
            'email': 'admin_loadtest@example.com',
            'password': 'AdminTest123!',
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access')
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
    
    @task(5)
    def get_admin_stats(self):
        """Get admin dashboard stats"""
        self.client.get('/api/v1/dashboard/admin-stats/')
    
    @task(3)
    def get_users_list(self):
        """Get users list"""
        self.client.get('/api/v1/users/customers/')
    
    @task(2)
    def get_kyc_submissions(self):
        """Get KYC submissions"""
        self.client.get('/api/v1/users/kyc/submissions/')


# Performance thresholds
THRESHOLDS = {
    'response_time_p50': 200,   # 50th percentile < 200ms
    'response_time_p95': 1000,  # 95th percentile < 1s
    'response_time_p99': 2000,  # 99th percentile < 2s
    'error_rate': 0.01,         # Error rate < 1%
}


@events.quitting.add_listener
def check_thresholds(environment, **kwargs):
    """Check if performance thresholds are met"""
    if isinstance(environment.runner, MasterRunner):
        return
    
    stats = environment.stats.total
    
    failures = []
    
    # Check response times
    if stats.get_response_time_percentile(0.5) > THRESHOLDS['response_time_p50']:
        failures.append(f"P50 response time {stats.get_response_time_percentile(0.5)}ms > {THRESHOLDS['response_time_p50']}ms")
    
    if stats.get_response_time_percentile(0.95) > THRESHOLDS['response_time_p95']:
        failures.append(f"P95 response time {stats.get_response_time_percentile(0.95)}ms > {THRESHOLDS['response_time_p95']}ms")
    
    if stats.get_response_time_percentile(0.99) > THRESHOLDS['response_time_p99']:
        failures.append(f"P99 response time {stats.get_response_time_percentile(0.99)}ms > {THRESHOLDS['response_time_p99']}ms")
    
    # Check error rate
    if stats.num_requests > 0:
        error_rate = stats.num_failures / stats.num_requests
        if error_rate > THRESHOLDS['error_rate']:
            failures.append(f"Error rate {error_rate:.2%} > {THRESHOLDS['error_rate']:.2%}")
    
    if failures:
        print("\n" + "=" * 50)
        print("PERFORMANCE THRESHOLD FAILURES:")
        for failure in failures:
            print(f"  ✗ {failure}")
        print("=" * 50 + "\n")
        environment.process_exit_code = 1
    else:
        print("\n" + "=" * 50)
        print("✓ All performance thresholds passed!")
        print("=" * 50 + "\n")


if __name__ == '__main__':
    print("""
    SikaRemit Load Testing
    ======================
    
    To run load tests:
    
    1. Install locust: pip install locust
    
    2. Run with web UI:
       locust -f load_test.py --host=http://localhost:8000
       Then open http://localhost:8089
    
    3. Run headless (CI/CD):
       locust -f load_test.py --host=http://localhost:8000 \\
              --headless -u 100 -r 10 -t 5m
       
       Options:
         -u 100  : 100 concurrent users
         -r 10   : Spawn 10 users per second
         -t 5m   : Run for 5 minutes
    
    4. Generate HTML report:
       locust -f load_test.py --host=http://localhost:8000 \\
              --headless -u 50 -r 5 -t 2m --html=report.html
    """)

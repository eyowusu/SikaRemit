#!/usr/bin/env python
"""
Django Development Server with Auto-Restart
This script automatically restarts the Django development server if it crashes.
"""

import subprocess
import time
import signal
import sys
from pathlib import Path

def signal_handler(signum, frame):
    """Handle interrupt signals gracefully"""
    print("\nShutting down development server...")
    sys.exit(0)

def run_server():
    """Run Django development server with auto-restart"""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    while True:
        print("Starting Django development server...")
        try:
            process = subprocess.Popen([
                sys.executable, '../manage.py', 'runserver', '8000', '--noreload'
            ], cwd=Path(__file__).parent)

            # Wait for the process to finish
            process.wait()

        except KeyboardInterrupt:
            print("\nReceived interrupt signal, shutting down...")
            break
        except Exception as e:
            print(f"Error starting server: {e}")

        # Check if we should restart
        if process.returncode == 0:
            print("Server exited normally")
            break
        else:
            print(f"Server crashed with code {process.returncode}, restarting in 2 seconds...")
            time.sleep(2)

if __name__ == '__main__':
    print("Django Development Server with Auto-Restart")
    print("Press Ctrl+C to stop")
    run_server()

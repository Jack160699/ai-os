# Gunicorn configuration for ai-os (Ubuntu EC2 + systemd).
# Start: gunicorn -c gunicorn.conf.py run:app
# Working directory must be the project root (same folder as run.py).

import multiprocessing
import os
from pathlib import Path

# Project root — keeps memory.json and .env resolution consistent with app.config.REPO_ROOT.
BASE_DIR = Path(__file__).resolve().parent
chdir = str(BASE_DIR)

# Bind localhost only; Nginx terminates TLS and reverse-proxies to here.
bind = os.environ.get("GUNICORN_BIND", "127.0.0.1:8000")

# Sync workers: each OpenAI call blocks one worker; tune for concurrency vs RAM.
_default_workers = min(max(multiprocessing.cpu_count(), 1), 4)
workers = int(os.environ.get("GUNICORN_WORKERS", str(_default_workers)))
threads = int(os.environ.get("GUNICORN_THREADS", "1"))
worker_class = "sync"

# WhatsApp + OpenAI can be slow; avoid worker kills mid-request.
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", "30"))

accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
capture_output = True

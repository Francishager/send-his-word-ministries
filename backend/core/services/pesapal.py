import os
import time
import requests
from typing import Optional, Tuple

# Minimal PesaPal API client for reconciliation
# Environment variables expected:
# - PESAPAL_BASE_URL (e.g., https://pay.pesapal.com/v3)
# - PESAPAL_CONSUMER_KEY
# - PESAPAL_CONSUMER_SECRET

_TOKEN_CACHE: Tuple[Optional[str], float] = (None, 0.0)


def _get_base_url() -> str:
    return os.getenv('PESAPAL_BASE_URL', 'https://pay.pesapal.com/v3').rstrip('/')


def get_access_token() -> Optional[str]:
    global _TOKEN_CACHE
    token, exp = _TOKEN_CACHE
    now = time.time()
    if token and now < exp:
        return token

    url = f"{_get_base_url()}/api/Auth/RequestToken"
    consumer_key = os.getenv('PESAPAL_CONSUMER_KEY')
    consumer_secret = os.getenv('PESAPAL_CONSUMER_SECRET')
    if not consumer_key or not consumer_secret:
        return None

    resp = requests.post(url, json={
        'consumerKey': consumer_key,
        'consumerSecret': consumer_secret,
    }, timeout=15)
    resp.raise_for_status()
    data = resp.json() or {}
    token = data.get('token') or data.get('access_token')
    # default TTL ~ 20 minutes if not provided
    expires_in = int(data.get('expires_in') or 1200)
    _TOKEN_CACHE = (token, now + max(60, expires_in - 60))
    return token


def get_transaction_status(order_tracking_id: Optional[str] = None,
                           transaction_tracking_id: Optional[str] = None) -> Optional[dict]:
    """
    Queries PesaPal for transaction status. Tries both orderTrackingId and transactionTrackingId if provided.
    Returns JSON dict on success or None.
    """
    token = get_access_token()
    if not token:
        return None

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    base = _get_base_url()

    # Prefer orderTrackingId endpoint if we have it
    if order_tracking_id:
        url = f"{base}/api/Transactions/GetTransactionStatus?orderTrackingId={order_tracking_id}"
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            return r.json()

    if transaction_tracking_id:
        url = f"{base}/api/Transactions/GetTransactionStatus?transactionTrackingId={transaction_tracking_id}"
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            return r.json()

    return None


def infer_status_from_response(resp: dict) -> Optional[str]:
    if not isinstance(resp, dict):
        return None
    # PesaPal common statuses: COMPLETED, FAILED, PENDING, INVALID
    status = resp.get('payment_status') or resp.get('status')
    if not status:
        return None
    status_u = str(status).lower()
    mapping = {
        'completed': 'succeeded',
        'paid': 'succeeded',
        'failed': 'failed',
        'invalid': 'failed',
        'pending': 'pending',
        'processing': 'processing',
    }
    return mapping.get(status_u, status_u)

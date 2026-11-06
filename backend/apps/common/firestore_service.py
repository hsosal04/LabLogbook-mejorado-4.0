"""Firestore bootstrap for future production use.

The generated project uses Django ORM locally for a self-contained setup,
but this service is ready to be used when Firebase credentials are provided.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings


@lru_cache(maxsize=1)
def get_firestore_client():
    if not settings.USE_FIRESTORE:
        return None

    if not settings.FIREBASE_CREDENTIALS_PATH:
        raise RuntimeError('USE_FIRESTORE=True but FIREBASE_CREDENTIALS_PATH is empty.')

    cred_path = Path(settings.FIREBASE_CREDENTIALS_PATH)
    if not cred_path.exists():
        raise FileNotFoundError(f'Firebase credentials file not found: {cred_path}')

    if not firebase_admin._apps:
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)

    return firestore.client()

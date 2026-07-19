"""
Simple in-memory TTL cache for FastAPI storefront endpoints.
Avoids redundant DB hits for read-heavy public endpoints.
"""
import time
import json
from typing import Any, Optional

class TTLCache:
    def __init__(self, ttl_seconds: int = 60):
        self._store: dict[str, tuple[Any, float]] = {}
        self.ttl = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            value, expires_at = self._store[key]
            if time.monotonic() < expires_at:
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl if ttl is not None else self.ttl
        self._store[key] = (value, time.monotonic() + ttl)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()


# Shared caches for different endpoint families
# Products/homepage: 60s TTL (fresh enough for catalog browsing)
product_cache = TTLCache(ttl_seconds=60)

# Brands/categories: 5 minutes TTL (rarely change)
meta_cache = TTLCache(ttl_seconds=300)

# Settings/layout: 2 minutes TTL
settings_cache = TTLCache(ttl_seconds=120)

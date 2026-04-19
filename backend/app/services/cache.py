import hashlib
import json
from cachetools import TTLCache

_cache = TTLCache(maxsize=256, ttl=60)


def _make_key(prefix: str, **kwargs) -> str:
    serialized = json.dumps(kwargs, sort_keys=True, default=str)
    h = hashlib.md5(serialized.encode()).hexdigest()
    return f"{prefix}:{h}"


def get_cached(key: str):
    return _cache.get(key)


def set_cached(key: str, value):
    _cache[key] = value


def invalidate_task(task_id: int | None = None):
    keys_to_delete = [
        k for k in _cache if k.startswith("task:") or k.startswith("tasks:")
    ]
    for k in keys_to_delete:
        _cache.pop(k, None)

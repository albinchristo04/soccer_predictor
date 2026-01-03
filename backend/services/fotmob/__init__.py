"""FotMob service module."""

from backend.services.fotmob.client import (
    FotMobClient,
    get_fotmob_client,
    cleanup_fotmob_client,
)

__all__ = ["FotMobClient", "get_fotmob_client", "cleanup_fotmob_client"]

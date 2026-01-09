"""Encryption utilities for securing sensitive data."""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import base64
from typing import Any
import json

from app.core.config import settings


class EncryptionManager:
    """Manages encryption and decryption of sensitive data."""

    def __init__(self, key: str):
        """Initialize encryption manager with a key."""
        # Derive a proper key from the provided key string
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"mcp_gateway_salt",  # In production, use a proper salt
            iterations=100000,
            backend=default_backend(),
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(key.encode()))
        self.fernet = Fernet(derived_key)

    def encrypt(self, data: str) -> str:
        """Encrypt a string."""
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt a string."""
        return self.fernet.decrypt(encrypted_data.encode()).decode()

    def encrypt_dict(self, data: dict[str, Any]) -> str:
        """Encrypt a dictionary as JSON."""
        json_str = json.dumps(data)
        return self.encrypt(json_str)

    def decrypt_dict(self, encrypted_data: str) -> dict[str, Any]:
        """Decrypt and parse a JSON dictionary."""
        json_str = self.decrypt(encrypted_data)
        return json.loads(json_str)


# Global encryption manager instance
encryption_manager = EncryptionManager(settings.encryption_key)

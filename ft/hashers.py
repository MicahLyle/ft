from __future__ import annotations

import binascii
import secrets
from typing import Any, Dict

from django.contrib.auth.hashers import BasePasswordHasher, mask_hash
from django.utils.crypto import constant_time_compare
from ft._vendor import pure_blake3


class Blake3PasswordHasher(BasePasswordHasher):
    """Custom Django password hasher using pure Python BLAKE3.

    Storage format: 'blake3$rounds$hex_salt$hex_digest'
    - rounds: number of BLAKE3 rounds applied (>=1)
    - salt: hex-encoded random salt bytes
    - digest: hex-encoded 32-byte BLAKE3 digest
    """

    algorithm = "blake3"

   
    rounds: int = 5000

    def salt(self) -> str:
        return binascii.hexlify(secrets.token_bytes(16)).decode("ascii")

    def encode(self, password: str, salt: str, iterations: int | None = None) -> str:
        assert password is not None
        assert salt and "$" not in salt

        rounds = int(iterations or self.rounds)
        if rounds < 1:
            raise ValueError("rounds must be >= 1")

        # Compute BLAKE3(salt || password) for 'rounds' iterations.
        # Each iteration feeds the previous digest back into the next.
        pwd_bytes = password.encode("utf-8")
        salt_bytes = binascii.unhexlify(salt.encode("ascii"))

        hasher = pure_blake3.Hasher()
        hasher.update(salt_bytes)
        hasher.update(pwd_bytes)
        digest = hasher.finalize()
        
        # Subsequent rounds hash the previous digest again with the salt.
        for _ in range(rounds - 1):
            hasher = pure_blake3.Hasher()
            hasher.update(salt_bytes)
            hasher.update(digest)
            digest = hasher.finalize()

        hex_digest = binascii.hexlify(digest).decode("ascii")
        return f"{self.algorithm}${rounds}${salt}${hex_digest}"

    def verify(self, password: str, encoded: str) -> bool:

        algorithm, rounds_str, salt, hex_digest = encoded.split("$", 3)
        if algorithm != self.algorithm:
            return False
        encoded_2 = self.encode(password, salt, iterations=int(rounds_str))
        return constant_time_compare(encoded, encoded_2)

    def safe_summary(self, encoded: str) -> Dict[str, Any]:
        algorithm, rounds_str, salt, hex_digest = encoded.split("$", 4)
        return {
            "algorithm": algorithm,
            "rounds": rounds_str,
            "salt": salt[:6] + "…" if len(salt) > 6 else salt,
            "hash": mask_hash(hex_digest),
        }

    def must_update(self, encoded: str) -> bool:
        try:
            algorithm, rounds_str, _salt, _hex_digest = encoded.split("$", 3)
        except ValueError:
            return True
        if algorithm != self.algorithm:
            return True
        try:
            rounds = int(rounds_str)
        except Exception:
            return True
        return rounds != self.rounds

    def harden_runtime(self, password: str, encoded: str) -> None:
        # Optional: Apply extra rounds to mitigate timing differences for wrong passwords.
        try:
            _algorithm, rounds_str, salt, _hex_digest = encoded.split("$", 3)
            extra = max(1, self.rounds - int(rounds_str))
        except Exception:
            return
        # Perform extra hashing without returning the result.
        _ = self.encode(password, salt, iterations=int(rounds_str) + extra)



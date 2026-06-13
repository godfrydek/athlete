# Security Model — Training Arc OS v11

## What is protected

- Local vault is encrypted with browser crypto before storage.
- Cloud sync stores encrypted vault JSON.
- Personal notes, food photos and logs stay in the vault unless exported.

## What is not magic

- If somebody knows your vault passphrase, they can unlock your data.
- A browser app cannot safely hide API secrets.
- Email, payment and AI provider secrets must stay on a backend/serverless function.

## Recommended personal setup

- Use a passphrase, not a 4-digit PIN.
- Export encrypted backup after big changes.
- Do not email decrypted JSON.
- Test cloud sync before deleting local data.

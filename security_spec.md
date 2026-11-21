# Firestore Security Specification

## 1. Data Invariants
1. **Default Deny**: Unmatched paths in `/databases/{database}/documents` are denied for all read and write operations.
2. **Admin Verification**: Administrative operations (creating/updating/deleting projects, modifying site settings, reading/deleting private contact messages, deleting reviews) require a verified Firebase Auth email matching the bootstrapped admin (`fatmaana4444@gmail.com` with `email_verified == true`) or a trusted `/admins/{uid}` record.
3. **PII Isolation (`messages`)**: Contact form submissions contain sender email addresses (PII). Public visitors can submit (`create`) validated messages, but ONLY verified admins may `get`, `list`, `update`, or `delete` messages.
4. **Strict Payload & Timestamp Integrity**:
   - Every `create` validates exact required and allowed keys (`hasAll` + `hasOnly`), preventing shadow fields.
   - `createdAt` must equal `request.time` on creation (`projects`, `reviews`, `messages`).
   - All string fields enforce bounded `.size()` limits to prevent resource exhaustion.
   - Document IDs are checked with `isValidId()` on single-document operations (`get`, `create`, `update`, `delete`).
   - Reviews enforce integer `rating >= 1 && rating <= 5`.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Project Creation**: Anonymous client attempts `create` on `/projects/p1`.
2. **Spoofed Admin Email (Unverified)**: User with `email: "fatmaana4444@gmail.com"` and `email_verified: false` attempts `create` on `/projects/p1`.
3. **Shadow Field Injection on Review**: Public user submits `/reviews/r1` with extra `isFeatured: true`.
4. **Out-of-Range Review Rating**: Public user submits `/reviews/r1` with `rating: 99` or `rating: 0`.
5. **Backdated Timestamp on Review**: Public user submits `/reviews/r1` with client timestamp instead of `request.time`.
6. **Oversized Message Bomb**: Public user submits `/messages/m1` with a 50,000-character message string.
7. **PII Scraping on Messages (List)**: Non-admin user attempts `list` on `/messages`.
8. **PII Scraping on Messages (Get)**: Non-admin user attempts `get` on `/messages/m1`.
9. **Unauthorized Review Tampering**: Non-admin user attempts `update` or `delete` on `/reviews/r1`.
10. **Unauthorized Site Settings Tampering**: Non-admin user attempts `set`/`update` on `/settings/site`.
11. **Malformed Document ID Poisoning**: Client attempts `create` at `/reviews/bad..id` (invalid characters/length).
12. **Self-Privilege Escalation**: Non-admin user attempts `create` at `/admins/{uid}` with `role: "admin"`.

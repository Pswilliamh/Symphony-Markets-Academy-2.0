# Symphony Markets — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Google Verified Identity Gate**: Every authenticated read and write requires `request.auth != null && request.auth.token.email_verified == true`. Unverified emails or anonymous sessions are strictly rejected.
3. **Strict Owner Isolation & Split-Collection PII / Secret Isolation**:
   - No PII (`email`, `phone`, `address`) is stored in `/users/{userId}` or `/academyConfig/{configId}`.
   - `/users/{userId}` can only be read (`get`), created, or updated when `request.auth.uid == userId` and `incoming().uid == request.auth.uid`.
   - `/academyConfig/publicGates` stores **only** 64-char SHA-256 hex digests (`^[a-f0-9]{64}$`) and public orientation video metadata (`get` allowed for `configId == 'publicGates'`; `create`/`update` strictly restricted to `isAcademyAdmin()`). Raw passcodes and admin emails are never stored in `/academyConfig`.
   - `/academyAdmin/settings` isolates the optional separate Admin Google email (`secondaryAdminEmail`) and instructor passcode reference labels strictly behind `isAcademyAdmin()` (`allow get, create, update: if adminDocId == 'settings' && isAcademyAdmin()`). Non-admin users receive `PERMISSION_DENIED` on any read or write to `/academyAdmin/settings`.
   - `list` and `delete` operations are denied (`false`) across all collections to eliminate scraping and preserve audit integrity.
4. **Master Gate Relational Sync & Bootstrapped + Separate Google Admin**:
   - A `/users/{userId}/walletApprovals/{approvalId}` document cannot be read, created, or updated unless its parent `/users/{userId}` document exists, belongs to `request.auth.uid`, and has `walletModeUnlocked == true`.
   - `isAcademyAdmin()` requires `isVerifiedUser()` AND either the bootstrapped owner email (`PsWilliamh@gmail.com` / `pswilliamh@gmail.com`) OR an exact verified email match against `/academyAdmin/settings.data.secondaryAdminEmail`.
5. **Terminal State & Immortal Fields**:
   - `createdAt`, `uid`, and `ownerUid` are immutable after creation, and `createdAt` / `updatedAt` must equal `request.time`.
   - Once a `WalletSetApproval` reaches terminal `status == 'signed'`, no subsequent updates are permitted (except `isAcademyAdmin()` recovery override).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Payload 01 — Unverified Email Spoof (including Admin Email Spoof)**: `{ email: "PsWilliamh@gmail.com", email_verified: false }` attempting to read `/academyAdmin/settings` or write `/academyConfig/publicGates`.
2. **Payload 02 — Cross-Tenant Identity Spoofing**: Authenticated as `user_attacker` writing `{ uid: "user_victim", ... }` to `/users/user_victim`.
3. **Payload 03 — Shadow Ghost Field Injection (Create)**: Adding `"isAdmin": true` to `/users/user_1` or `/academyConfig/publicGates` alongside valid fields.
4. **Payload 04 — Shadow Ghost Field Injection (Update)**: Updating `/users/user_1` with `walletModeUnlocked: true` plus `"role": "superuser"`.
5. **Payload 05 — ID Poisoning (2KB Path Variable / Unauthorized Singleton ID)**: Writing to `/academyConfig/evil_doc` or `/users/user_1/walletApprovals/<2000-char-junk-id$%#>`.
6. **Payload 06 — Orphaned Subcollection Write (Missing Master Gate)**: Creating `/users/user_no_session/walletApprovals/set_1` before `/users/user_no_session` exists or while `walletModeUnlocked == false`.
7. **Payload 07 — Client Timestamp Forgery**: Creating `/users/user_1` or `/academyConfig/publicGates` with backdated `createdAt: "2020-01-01T00:00:00Z"` (`!= request.time`).
8. **Payload 08 — Immortal Field Mutation**: Updating `/users/user_1` or `/academyAdmin/settings` while mutating `createdAt`.
9. **Payload 09 — Terminal State Bypass**: Non-admin updating `/users/user_1/walletApprovals/set_1` after `existing().status == 'signed'` back to `'dispatched'`.
10. **Payload 10 — Plaintext Passcode / Invalid Hash Injection**: Writing a non-SHA256 string (e.g. `"my_raw_password"`) into `intermediatePasscodeHash` on `/academyConfig/publicGates`.
11. **Payload 11 — Non-Admin PII / Admin Settings Read or Write**: Verified student (`student@example.com`) attempting `get` or `update` on `/academyAdmin/settings` or `update` on `/academyConfig/publicGates`.
12. **Payload 12 — Unauthorized Collection Scraping (`list`)**: Executing a `list` query against `/users`, `/academyConfig`, or `/academyAdmin`.

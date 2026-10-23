# Security Specification - Mainul Meta Gen

## Data Invariants
1. A user profile must have a valid UID matching the document ID.
2. Only the owner can read their own profile.
3. Only an Admin can list all users or update any user's `role` or `hasAccess` status.
4. Users cannot upgrade their own role or grant themselves access.
5. All timestamps (`createdAt`, `updatedAt`) must be server-generated.

## The Dirty Dozen Payloads (Target: /users/{userId})

1. **Self-Promotion**: User attempts to set `role: 'admin'` on their own profile during creation.
2. **Access Injection**: User attempts to set `hasAccess: true` on their own profile.
3. **Identity Spoofing**: User A tries to read User B's profile.
4. **Keyword Poisoning**: User tries to update their profile with a 1MB string in `displayName`.
5. **Timestamp Fraud**: User provides a manual `updatedAt` value from the past.
6. **Ghost Fields**: User adds a `isDeveloper: true` field to the profile.
7. **Admin Impersonation**: Non-admin user tries to query the entire `/users` collection.
8. **Delete Own Record**: User tries to delete their profile to reset a trial (if implemented).
9. **Role Modification**: User tries to `patch` their `role` field after it has been set.
10. **ID Poisoning**: User uses a document ID that doesn't match their `request.auth.uid`.
11. **Email Spoofing**: User provides an email that doesn't match `request.auth.token.email`.
12. **Anonymous Write**: Unauthenticated user tries to register.

## Test Runner (Verification)
The `firestore.rules` will be written to deny these operations explicitly.

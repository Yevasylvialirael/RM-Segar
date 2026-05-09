# Security Specification - RM Segar

## Data Invariants
1. A user can only read and write their own profile.
2. Orders and Reservations must have a valid `userId` matching the authenticated user.
3. Once an order/reservation is "Selesai" or "Dibatalkan", it cannot be modified by the user (Terminal State Locking).
4. `createdAt` must be set to `request.time` and remains immutable.
5. `paymentMethod` and `orderType` must be from a predefined list.

## The Dirty Dozen Payloads (Target: Denied)

1. **Identity Spoofing**: Create order with `userId: "other_user"`.
2. **Shadow Field Injection**: Create order with field `isAdmin: true`.
3. **Ghost Field Update**: Update order with `hack: "junk"`.
4. **Terminal State Bypass**: Change a "Selesai" order back to "Pending".
5. **Unauthorized Access**: User A attempts to `get` User B's reservation.
6. **ID Poisoning**: Create order with 2KB string as ID.
7. **Resource Exhaustion**: Send 1MB string in `note` field.
8. **PII Leak**: Unauthenticated user tries to `list` the `users` collection.
9. **Relational Sync Break**: Create order without satisfying `isValid[Entity]`.
10. **Immutable Field Edit**: Attempt to update `createdAt` timestamp.
11. **Future Dating**: Set `createdAt` to a future date instead of `request.time`.
12. **Admin Privilege Escalation**: User tries to write to the `admins` collection.

## Tests
See `firestore.rules.test.ts` (conceptual) for verification logic.

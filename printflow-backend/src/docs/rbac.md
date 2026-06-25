RBAC and Role Bootstrapping for PrintFlow

Summary
- All newly created users are assigned role `student` by default (User model default).
- Registration and sync endpoints must never allow client-side selection of admin/operator/faculty roles.
- The first administrator is bootstrapped when a user syncs and their email matches the SUPER_ADMIN_EMAIL env var.

Environment
- Add to .env:
  SUPER_ADMIN_EMAIL=23501a4246@siddhartha.edu.in

Endpoints
1) POST /api/users/sync
- Protected by Clerk requireAuth()
- Server-side logic:
  - Validate allowed email domain
  - Find or create user by clerkId
  - If created and email === SUPER_ADMIN_EMAIL -> set role: 'admin'
  - Otherwise default role remains 'student'

2) PATCH /api/users/:id/role
- Admin-only endpoint (allowRoles('admin'))
- Body: { "role": "student|faculty|operator|admin" }
- Only users with role 'admin' may call this endpoint

Security Notes
- Do not expose admin/operator/faculty role options in frontend registration UI.
- Server side always ignores any role provided in public create/update endpoints.
- Principle of Least Privilege: only admin may change roles.

Example curl (admin):
  curl -X PATCH 'https://your-backend.example.com/api/users/<userId>/role' \
    -H 'Authorization: Bearer <CLERK_SESSION_TOKEN>' \
    -H 'Content-Type: application/json' \
    -d '{"role":"operator"}'

Migration
- To promote an existing account to admin manually, set their email to SUPER_ADMIN_EMAIL or use the admin role endpoint if you already have an admin account.

Audit
- Recommend logging role changes (who, when, previousRole -> newRole) in production for auditability (not implemented in current changes).

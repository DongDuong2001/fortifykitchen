# Security Policy

## Supported Versions

Only the latest release on the `main` branch receives security updates. Older versions are not maintained.

| Version | Supported |
|---------|-----------|
| main (latest) | Yes |
| < main | No |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue.
2. Send details to: security@fortifykitchen.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for remediation.

## Security Measures Implemented

### Authentication & Authorization
- **Neon Auth (Primary)**: JWKS-based JWT verification using RSA public keys from Neon Auth's `.well-known/jwks.json` endpoint. Tokens are validated for signature, expiration, audience, and issuer.
- **HMAC JWT (Fallback)**: Custom HS256 implementation for legacy tokens using `JWT_SECRET`. Used during migration period.
- **Role-Based Access Control**: User roles (ADMIN, MANAGER, STAFF, CUSTOMER) enforced via `@UseGuards(RolesGuard)` and `@Roles()` decorator.
- **Password Hashing**: Argon2id with configurable memory/parallelism parameters.

### API Security
- **Rate Limiting**: `@nestjs/throttler` with configurable TTL and limit per IP.
- **CORS**: Strict origin allowlist (no wildcard in production). Credentials enabled.
- **Helmet**: Security headers (Content Security Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security).
- **Input Validation**: Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Request Size Limits**: Express body parser limits to prevent DoS via large payloads.

### Database Security
- **Parameterized Queries**: Prisma ORM prevents SQL injection by default.
- **Connection Pooling**: Neon PgBouncer transaction pooler with TLS (`sslmode=require`).
- **Least Privilege**: Database user has only required permissions (no superuser).

### Secrets Management
- All secrets injected via environment variables on Render/Vercel/Neon.
- No secrets committed to repository (`.env`, `.env.prod`, `.env.local` in `.gitignore`).
- Production secrets rotated quarterly.

### Cron Job Security
- Dedicated `CRON_SECRET` for internal job authentication.
- Bearer token validation via `CronAuthGuard`.
- Cron endpoints not publicly documented in Swagger.

### File Upload Security
- Cloudinary signed uploads with server-generated signatures.
- File type validation (images only).
- Size limits enforced client and server-side.

### Audit Logging
- All authentication events logged (login, logout, token refresh, failed attempts).
- Admin actions logged (order status changes, user management, subscription modifications).
- PII minimized in logs.

## Security Headers (Production)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cloudinary.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.cloudinary.com; connect-src 'self' https://fortifykitchen-api.onrender.com https://*.neonauth.c-2.ap-southeast-1.aws.neon.tech;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Dependency Security

- `pnpm audit` run in CI pipeline.
- Dependabot alerts enabled on GitHub.
- Critical/high vulnerabilities block merge.

## Incident Response

1. **Detection**: Monitoring via Render logs, Neon metrics, Sentry (if configured).
2. **Containment**: Rotate affected secrets, revoke compromised tokens, disable affected endpoints.
3. **Eradication**: Patch vulnerability, redeploy.
4. **Recovery**: Verify fix, monitor for anomalies.
5. **Post-Incident**: Root cause analysis, update runbooks, improve detection.

## Compliance

- Data minimization: Only collect required personal data.
- Right to deletion: Customer data removable via admin panel or API.
- Data retention: Orders retained 2 years, audit logs 90 days, sessions 30 days.
- Cross-border transfer: Neon database hosted in Asia Pacific (Singapore region).

## Contact

Security Team: security@fortifykitchen.com
GPG Key: (available on request)
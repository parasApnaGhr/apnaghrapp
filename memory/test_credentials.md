# ApnaGhr Visit Platform - Test Credentials

## DEFAULT ACCOUNTS (Auto-created on first startup)

### Admin Account
- **Phone**: 7777777777
- **Password**: admin123
- **Role**: admin

### Customer Account
- **Phone**: 6987654321
- **Password**: test123
- **Role**: customer

### Rider Account
- **Phone**: 6111222333
- **Password**: rider123
- **Role**: rider

### Advertiser Account
- **Phone**: 6222333444
- **Password**: adv123
- **Role**: advertiser

### Builder Account
- **Phone**: 6333444555
- **Password**: build123
- **Role**: builder

---

## Notes
- These accounts are **automatically created** when the app starts (if they don't exist)
- Works in both development and production environments
- The seed script runs on every backend startup via `@app.on_event("startup")`
- Registration supports all roles: customer, rider, advertiser, builder
- Forgot Password flow uses OTP (SMS/Email in production, console log in development)

## Health Check Endpoints
- `/health` - Root level health check for Kubernetes
- `/api/health` - API level health check

# ApnaGhr Visit Platform - Test Credentials

## Customer Account
- **Phone**: 6987654321
- **Password**: newpass123
- **Role**: customer

## Rider Account
- **Phone**: 6111222333
- **Password**: rider123
- **Role**: rider

## Advertiser Account
- **Phone**: 6222333444
- **Password**: adv123
- **Role**: advertiser

## Builder Account
- **Phone**: 6333444555
- **Password**: build123
- **Role**: builder

## Admin Account
- **Phone**: 7777777777
- **Password**: admin123
- **Role**: admin

---

## Notes
- All accounts are REAL accounts created via `/api/auth/register` endpoint
- No mock credentials - all accounts work with proper JWT authentication
- Registration supports all 4 roles: customer, rider, advertiser, builder
- Forgot Password flow uses OTP (currently logged to console, returns in response for testing)

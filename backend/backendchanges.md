# Backend Changelog

## 2026-04-18

### Architecture and Server Startup fixes
- **Dependencies Adjusted**: Removed the legacy and defunct `emergentintegrations` pip package constraint inside `requirements.txt` and pinned `urllib3==2.0.7` to prevent version conflicts.
- **Bootstrapped `.env`**: Created `.env` and populated required database connection keys including `DB_NAME`, `MONGO_URL`, and a dynamic `JWT_SECRET` hex key.
- **Fixed File Upload Paths**: Modified `server.py` to calculate `UPLOAD_DIR` dynamically relative to its current path on Windows `Path(__file__).parent / "uploads"` instead of using the Unix hardcoded `/app/uploads` schema, which triggered `FileNotFoundError`.
- **Modular Imports Fix**: `server_new.py` failed fetching `setup_seller_routes()` due to the `bcrypt_module` position, properly imported `bcrypt` directly and parsed it.

### TLS / MongoDB Stability
- **Fixed `pymongo.errors.NetworkTimeout` on Windows**: Modified `AsyncIOMotorClient` setups globally to dynamically append a curated CA cert array explicitly with `tlsCAFile=certifi.where()`. This successfully circumvents Windows handshake issues across:
  - `create_test_credentials.py`
  - `server.py` & `server_new.py`
  - `routes/advertising.py`
  - `routes/chatbot.py`
  - `routes/inventory_access.py`
  - `routes/packers.py`
  - `routes/seller_verification.py`
  - `utils/database.py`
- Repaired resulting `SyntaxError` regressions on `AsyncIOMotorClient` initializations.

### Legacy Code Stubs (Temporary Migration Hooks)
- **Safe-Stubbed `emergentintegrations`**: Rather than stripping out the AI components completely inside:
  - `routes/advertising.py`
  - `routes/ai_validation.py`
  - `routes/chatbot.py`
  Created lightweight fallback stub classes for `LlmChat`, `OpenAIImageGeneration`, and `UserMessage`, effectively allowing the router methods to return a placeholder exception/message gracefully instead of crashing on module load.

### Scripts
- Added and executed `create_test_credentials.py` to seamlessly insert initial testing data allowing immediate frontend login as Admin (using phone: `9999999999` and password `Admin@123`).

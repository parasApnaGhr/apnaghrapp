#!/bin/bash
echo "Rolling back to backup..."
cp server.py.backup /app/backend/server.py
cp -r routes_backup/* /app/backend/routes/
cp .env.backup /app/backend/.env
sudo supervisorctl restart backend
echo "Rollback complete!"

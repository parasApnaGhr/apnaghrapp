FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed by Pillow and cryptography
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    libssl-dev \
    libjpeg-dev \
    libpng-dev \
    zlib1g-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory (used by static file mount)
RUN mkdir -p /app/uploads

# Expose port (Cloud Run injects $PORT at runtime)
EXPOSE 8080

# Start the server
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080}

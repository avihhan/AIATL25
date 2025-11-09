# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire src directory and other necessary files
COPY src/ ./src/
COPY database_migrations/ ./database_migrations/

# Create a non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Cloud Run will override this with PORT env var)
EXPOSE 8080

# Use gunicorn for production with proper configuration
# - bind to 0.0.0.0:$PORT for Cloud Run
# - 2 workers (adjust based on your needs)
# - timeout of 120 seconds
# - access logs enabled
CMD exec gunicorn --bind :$PORT \
    --workers 2 \
    --threads 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    src.main:app


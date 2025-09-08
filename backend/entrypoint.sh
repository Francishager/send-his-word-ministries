#!/bin/bash

# Set default port if not provided
export PORT=${PORT:-8000}

# Debug: Print the PORT value
echo "PORT is set to: ${PORT}"

# Run Django migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Validate PORT is numeric
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "Invalid PORT: ${PORT}, using default 8000"
    export PORT=8000
fi

# Start Gunicorn
echo "Starting Gunicorn on port ${PORT}"
exec gunicorn sendhisword.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

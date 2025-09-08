#!/bin/bash

# Run Django migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn on fixed port 8000
echo "Starting Gunicorn on port 8000"
exec gunicorn sendhisword.wsgi:application \
    --bind "0.0.0.0:8000" \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

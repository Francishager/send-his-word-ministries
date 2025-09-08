#!/bin/bash

# Debug environment
echo "=== DEBUG INFO ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Django version: $(python -c 'import django; print(django.get_version())')"
echo "DATABASE_URL set: ${DATABASE_URL:+yes}"
echo "DJANGO_SECRET_KEY set: ${DJANGO_SECRET_KEY:+yes}"
echo "==================="

# Test database connection
echo "Testing database connection..."
python manage.py check --database default || {
    echo "Database check failed!"
    exit 1
}

# Run Django migrations with verbose output
echo "Running migrations..."
python manage.py migrate --noinput --verbosity=2 || {
    echo "Migration failed!"
    exit 1
}

# Create staticfiles directory and collect static files
mkdir -p /app/staticfiles
python manage.py collectstatic --noinput --verbosity=2

# Test that the Service model is accessible
echo "Testing Service model..."
python manage.py shell -c "
from core.models import Service
print('Service model loaded successfully')
print(f'Service count: {Service.objects.count()}')
" || {
    echo "Service model test failed!"
    exit 1
}

# Start Gunicorn on fixed port 8000
echo "Starting Gunicorn on port 8000"
exec gunicorn sendhisword.wsgi:application \
    --bind "0.0.0.0:8000" \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level debug

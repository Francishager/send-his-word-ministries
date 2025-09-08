"""
WSGI config for Send His Word Ministries backend.

This exposes the WSGI callable as a module-level variable named ``application``.
It is used by WSGI servers such as Gunicorn on Railway.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sendhisword.settings")

application = get_wsgi_application()

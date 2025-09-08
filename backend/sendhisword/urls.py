from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Mount users app routes if defined
    path('api/users/', include('users.urls')),
    # Mount core app API routes (includes /services, /giving, /donations, /payments, reports, etc.)
    path('api/', include('core.urls')),
]

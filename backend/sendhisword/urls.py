from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Mount users app routes if defined
    path('api/users/', include('users.urls')),
]

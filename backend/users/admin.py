from django.contrib import admin
from .models import User, Role, UserRole, UserProfile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name", "is_active", "is_staff", "date_joined")
    search_fields = ("email", "first_name", "last_name")
    list_filter = ("is_active", "is_staff", "is_superuser")

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "assigned_at")
    list_filter = ("role",)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "country", "created_at")
    search_fields = ("user__email", "city", "country")

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from .models import Role

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser or request.user.is_admin()))

class IsMinisterUser(permissions.BasePermission):
    """
    Allows access only to minister users.
    """
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_minister() or request.user.is_admin()))

class IsAdminOrMinisterUser(permissions.BasePermission):
    """
    Allows access to both admin and minister users.
    """
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_minister() or request.user.is_admin()))

class IsSelfOrAdmin(permissions.BasePermission):
    """
    Allows access only to the user themselves or an admin.
    """
    def has_object_permission(self, request, view, obj):
        return bool(request.user and (request.user.is_admin() or obj == request.user))

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Instance must have an attribute named 'owner'.
        return obj.owner == request.user

class HasRolePermission(permissions.BasePermission):
    """
    Permission class to check if the user has a specific role.
    """
    def __init__(self, role_name):
        self.role_name = role_name
        super().__init__()

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers and staff have all permissions
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # Check if the user has the required role
        return request.user.roles.filter(name=self.role_name).exists()

class HasAnyRolePermission(permissions.BasePermission):
    """
    Permission class to check if the user has any of the specified roles.
    """
    def __init__(self, role_names):
        self.role_names = role_names if isinstance(role_names, (list, tuple)) else [role_names]
        super().__init__()

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers and staff have all permissions
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # Check if the user has any of the required roles
        return request.user.roles.filter(name__in=self.role_names).exists()

class HasPermission(permissions.BasePermission):
    """
    Permission class to check if the user has a specific permission.
    """
    def __init__(self, permission_codename):
        self.permission_codename = permission_codename
        super().__init__()

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers and staff have all permissions
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # Check if the user has the required permission in any of their roles
        return request.user.roles.filter(
            permissions__has_key=self.permission_codename,
            permissions__contains={self.permission_codename: True},
        ).exists()

def has_permission_decorator(permission_codename):
    """
    Decorator to check if the user has a specific permission.
    """
    def decorator(view_func):
        def wrapped_view(self, request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {"error": "Authentication credentials were not provided."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            if request.user.is_superuser or request.user.is_staff:
                return view_func(self, request, *args, **kwargs)
                
            has_perm = request.user.roles.filter(
                permissions__has_key=permission_codename,
                permissions__contains={permission_codename: True},
            ).exists()
            
            if has_perm:
                return view_func(self, request, *args, **kwargs)
                
            return Response(
                {"error": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        return wrapped_view
    return decorator

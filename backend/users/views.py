from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.cache import cache
from core.services.validators import is_valid_email
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404

from .models import User, Role
from .serializers import (
    UserSerializer, RegisterSerializer, 
    ChangePasswordSerializer, RoleAssignmentSerializer,
    RoleSerializer
)
from .permissions import IsAdminUser, IsAdminOrMinisterUser

class RegisterView(generics.CreateAPIView):
    """
    View for user registration.
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    """
    View for user login.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Simple IP-based rate limit: 20 requests per 60 seconds
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR') or 'unknown'
        key = f"login_rate:{ip}"
        count = cache.get(key, 0)
        if count and int(count) >= 20:
            return Response({'error': 'Too many attempts. Please try again shortly.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        cache.set(key, int(count) + 1, timeout=60)

        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate email format early to avoid unnecessary auth hits
        if not is_valid_email(email):
            return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)

        # Django's ModelBackend expects 'username' kwarg which maps to USERNAME_FIELD ('email' on our User model)
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Log the user in (optional, for session-based auth)
        login(request, user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class LogoutView(APIView):
    """
    View for user logout.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            logout(request)
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    View to retrieve or update the current user's profile.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        # Only allow updating specific fields
        allowed_fields = ['first_name', 'last_name', 'phone', 'bio', 'profile_picture']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = self.get_serializer(
            self.get_object(), 
            data=data, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class ChangePasswordView(generics.UpdateAPIView):
    """
    View for changing user password.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log the user out after password change (optional)
        # logout(request)
        
        return Response({"message": "Password updated successfully"})

class UserListView(generics.ListAPIView):
    """
    View to list all users (admin only).
    """
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering based on query parameters
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(roles__name=role)
        return queryset.order_by('-date_joined')

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View to retrieve, update, or delete a user (admin only).
    """
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = 'id'
    
    def perform_destroy(self, instance):
        # Soft delete by setting is_active to False
        instance.is_active = False
        instance.save()

class AssignRoleView(APIView):
    """
    View to assign roles to users (admin only).
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, *args, **kwargs):
        serializer = RoleAssignmentSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class CurrentUserView(APIView):
    """
    View to get the current authenticated user's details.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class RequestRoleView(APIView):
    """
    View for users to request a role (e.g., ATTENDEE to MINISTER).
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        role_name = request.data.get('role')
        
        if not role_name:
            return Response(
                {"error": "Role is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the requested role
        if role_name not in dict(Role.RoleType.choices):
            return Response(
                {"error": "Invalid role"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already has this role
        if request.user.roles.filter(name=role_name).exists():
            return Response(
                {"message": f"You already have the {role_name} role"},
                status=status.HTTP_200_OK
            )
        
        # In a real application, you would create a role request here
        # and notify admins for approval
        # For now, we'll just return a success message
        return Response({
            "message": f"Your request for the {role_name} role has been submitted for approval"
        }, status=status.HTTP_200_OK)

class RoleListView(generics.ListCreateAPIView):
    """
    View to list all roles or create a new role (admin only).
    """
    permission_classes = [IsAdminUser]
    serializer_class = RoleSerializer
    queryset = Role.objects.all()

class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View to retrieve, update, or delete a role (admin only).
    """
    permission_classes = [IsAdminUser]
    serializer_class = RoleSerializer
    queryset = Role.objects.all()
    lookup_field = 'pk'

    def perform_destroy(self, instance):
        # Prevent deletion of system roles
        if instance.name in dict(Role.RoleType.choices):
            raise serializers.ValidationError("System roles cannot be deleted.")
        instance.delete()

class RolePermissionsView(APIView):
    """
    View to manage permissions for a specific role (admin only).
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        return Response({
            'role': role.name,
            'permissions': role.permissions
        })
    
    def post(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        permissions = request.data.get('permissions', {})
        
        if not isinstance(permissions, dict):
            return Response(
                {"error": "Permissions must be a dictionary"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        role.permissions = permissions
        role.save()
        
        return Response({
            'message': 'Permissions updated successfully',
            'role': role.name,
            'permissions': role.permissions
        })

class UserRolesView(APIView):
    """
    View to manage a user's roles (admin only).
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        return Response({
            'user_id': user.id,
            'email': user.email,
            'roles': [role.name for role in user.roles.all()]
        })
    
    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        role_name = request.data.get('role')
        
        if not role_name:
            return Response(
                {"error": "Role name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            return Response(
                {"error": f"Role '{role_name}' does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user.roles.add(role)
        user.save()
        
        return Response({
            'message': f"Role '{role_name}' added to user {user.email}",
            'user_id': user.id,
            'roles': [r.name for r in user.roles.all()]
        })
    
    def delete(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        role_name = request.data.get('role')
        
        if not role_name:
            return Response(
                {"error": "Role name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            return Response(
                {"error": f"Role '{role_name}' does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent removing the last admin role
        if role_name == 'ADMIN' and user.roles.filter(name='ADMIN').count() <= 1:
            return Response(
                {"error": "Cannot remove the last admin role"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.roles.remove(role)
        user.save()
        
        return Response({
            'message': f"Role '{role_name}' removed from user {user.email}",
            'user_id': user.id,
            'roles': [r.name for r in user.roles.all()]
        })

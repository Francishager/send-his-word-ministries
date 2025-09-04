from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    
    # JWT token management
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Current user
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
    path('me/profile/', views.UserProfileView.as_view(), name='my-profile'),
    path('me/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('me/request-role/', views.RequestRoleView.as_view(), name='request-role'),
    
    # Admin endpoints
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/assign-role/', views.AssignRoleView.as_view(), name='assign-role'),
    
    # Role management (admin only)
    path('roles/', views.RoleListView.as_view(), name='role-list'),
    path('roles/<int:pk>/', views.RoleDetailView.as_view(), name='role-detail'),
]

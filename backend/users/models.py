from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class Role(models.Model):
    """
    Role model to be used for role-based access control.
    """
    class RoleType(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MINISTER = 'MINISTER', 'Minister'
        ATTENDEE = 'ATTENDEE', 'Attendee'
    
    name = models.CharField(
        max_length=20,
        choices=RoleType.choices,
        unique=True,
        default=RoleType.ATTENDEE
    )
    description = models.TextField(blank=True, null=True)
    permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.get_name_display()

    class Meta:
        ordering = ['name']
        db_table = 'roles'

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model for Send His Word Ministries.
    """
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    middle_name = models.CharField(max_length=150, blank=True)  
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    
    # Role and permissions
    roles = models.ManyToManyField('Role', through='UserRole', related_name='users', blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def has_role(self, role_name):
        """Check if user has the specified role."""
        return self.roles.filter(name=role_name).exists()
    
    def is_admin(self):
        return self.has_role('ADMIN') or self.is_superuser
    
    def is_minister(self):
        return self.has_role('MINISTER') or self.is_admin()
    
    def is_attendee(self):
        return self.has_role('ATTENDEE') or self.is_minister()

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
        db_table = 'users'

class UserRole(models.Model):
    """Explicit through model mapping to SQL table 'user_roles'."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_roles'
        unique_together = ('user', 'role')

class UserProfile(models.Model):
    """
    Extended user profile information.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Social media links
    website = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-created_at']

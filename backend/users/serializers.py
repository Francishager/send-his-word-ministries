from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, UserProfile, Role

User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'date_of_birth', 'address', 'city', 'country', 'postal_code',
            'website', 'facebook', 'twitter', 'instagram',
            'email_notifications', 'push_notifications'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    roles = RoleSerializer(many=True, read_only=True)
    role_names = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name',
        source='roles'
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'bio',
            'profile_picture', 'is_active', 'is_verified', 'date_joined',
            'last_login', 'roles', 'role_names', 'profile'
        ]
        read_only_fields = ['id', 'is_active', 'is_verified', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
            'profile_picture': {'required': False}
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Remove profile_picture if it's None
        if not representation.get('profile_picture'):
            representation.pop('profile_picture', None)
        return representation

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user, **profile_data)
        
        # Assign default role if not provided
        if not user.roles.exists():
            attendee_role, _ = Role.objects.get_or_create(
                name=Role.RoleType.ATTENDEE,
                defaults={'description': 'Regular attendee of the ministry'}
            )
            user.roles.add(attendee_role)
        
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update profile
        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password2',
            'first_name', 'last_name', 'phone'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove password2 from the data
        validated_data.pop('password2', None)
        
        # Create user with hashed password
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            is_active=True  # Or set to False if email verification is required
        )
        user.set_password(validated_data['password'])
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        # Assign default role
        attendee_role, _ = Role.objects.get_or_create(
            name=Role.RoleType.ATTENDEE,
            defaults={'description': 'Regular attendee of the ministry'}
        )
        user.roles.add(attendee_role)
        
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct")
        return value
    
    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "New passwords don't match"})
        return data
    
    def save(self, **kwargs):
        password = self.validated_data['new_password']
        user = self.context['request'].user
        user.set_password(password)
        user.save()
        return user

class RoleAssignmentSerializer(serializers.Serializer):
    role_name = serializers.ChoiceField(choices=Role.RoleType.choices)
    user_id = serializers.IntegerField()
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(pk=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        return user
    
    def validate(self, data):
        user = data['user_id']
        role_name = data['role_name']
        
        # Check if the requesting user has permission to assign this role
        request_user = self.context['request'].user
        if not request_user.is_admin():
            raise serializers.ValidationError("You don't have permission to assign roles")
        
        # Prevent users from modifying their own roles
        if user == request_user and role_name != 'ADMIN':
            raise serializers.ValidationError("You cannot remove your own admin role")
            
        return data
    
    def create(self, validated_data):
        user = validated_data['user_id']
        role_name = validated_data['role_name']
        
        # Get or create the role
        role, _ = Role.objects.get_or_create(
            name=role_name,
            defaults={'description': f'{role_name.capitalize()} role'}
        )
        
        # Add the role to the user
        user.roles.add(role)
        
        return {'user_id': user.id, 'role': role.name}
    
    def to_representation(self, instance):
        return {
            'user_id': instance['user_id'].id,
            'role': instance['role'],
            'message': f"Role {instance['role']} assigned successfully"
        }

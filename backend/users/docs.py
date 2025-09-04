from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status

# Common schemas
error_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
)

success_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={'message': openapi.Schema(type=openapi.TYPE_STRING)}
)

# Auth schemas
login_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['email', 'password'],
    properties={
        'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),
        'password': openapi.Schema(type=openapi.TYPE_STRING, format='password')
    }
)

register_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['email', 'password', 'password2', 'first_name', 'last_name'],
    properties={
        'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),
        'password': openapi.Schema(type=openapi.TYPE_STRING, format='password'),
        'password2': openapi.Schema(type=openapi.TYPE_STRING, format='password'),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
        'phone': openapi.Schema(type=openapi.TYPE_STRING, nullable=True)
    }
)

# User schema
user_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER, read_only=True),
        'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
        'is_active': openapi.Schema(type=openapi.TYPE_BOOLEAN),
        'roles': openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_STRING)
        )
    }
)

# API documentation decorators
def login_docs():
    return swagger_auto_schema(
        operation_summary="User Login",
        operation_description="Authenticate user and get JWT tokens",
        request_body=login_schema,
        responses={
            200: openapi.Response('Login successful', user_schema),
            400: error_schema,
            401: error_schema
        },
        tags=['Authentication']
    )

def register_docs():
    return swagger_auto_schema(
        operation_summary="Register User",
        operation_description="Create a new user account",
        request_body=register_schema,
        responses={
            201: openapi.Response('Registration successful', user_schema),
            400: error_schema
        },
        tags=['Authentication']
    )

def user_profile_docs():
    return {
        'get': swagger_auto_schema(
            operation_summary="Get User Profile",
            responses={
                200: openapi.Response('User profile', user_schema),
                401: error_schema
            },
            tags=['User Management']
        ),
        'put': swagger_auto_schema(
            operation_summary="Update User Profile",
            request_body=user_schema,
            responses={
                200: openapi.Response('Profile updated', user_schema),
                400: error_schema,
                401: error_schema
            },
            tags=['User Management']
        )
    }

def user_list_docs():
    return swagger_auto_schema(
        operation_summary="List Users",
        manual_parameters=[
            openapi.Parameter(
                'role', 
                openapi.IN_QUERY, 
                description="Filter by role name", 
                type=openapi.TYPE_STRING
            )
        ],
        responses={
            200: openapi.Response('List of users', openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=user_schema
            )),
            403: error_schema
        },
        tags=['Admin']
    )

def assign_role_docs():
    return swagger_auto_schema(
        operation_summary="Assign Role",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['user_id', 'role'],
            properties={
                'user_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'role': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=['ADMIN', 'MINISTER', 'ATTENDEE']
                )
            }
        ),
        responses={
            200: success_schema,
            400: error_schema,
            403: error_schema
        },
        tags=['Admin']
    )

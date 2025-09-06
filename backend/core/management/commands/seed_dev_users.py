from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, Role, UserRole

DEV_USERS = [
    {
        "email": "admin@shwm.local",
        "password": "password123",
        "roles": [Role.RoleType.ADMIN],
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "email": "minister@shwm.local",
        "password": "password123",
        "roles": [Role.RoleType.MINISTER],
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "email": "member@shwm.local",
        "password": "password123",
        "roles": [Role.RoleType.ATTENDEE],
        "is_staff": False,
        "is_superuser": False,
    },
]

class Command(BaseCommand):
    help = "Seed development users (ADMIN, MINISTER, MEMBER) and base roles"

    def add_arguments(self, parser):
        parser.add_argument("--reset-passwords", action="store_true", help="Reset passwords for existing dev users")

    @transaction.atomic
    def handle(self, *args, **options):
        # Ensure roles exist
        roles_map = {}
        for role_type in Role.RoleType:
            role_obj, _ = Role.objects.get_or_create(name=role_type)
            roles_map[role_type] = role_obj
        self.stdout.write(self.style.SUCCESS("Roles ensured."))

        for spec in DEV_USERS:
            email = spec["email"]
            pwd = spec["password"]
            is_staff = spec["is_staff"]
            is_superuser = spec["is_superuser"]
            roles = [roles_map[r] for r in spec["roles"]]

            user, created = User.objects.get_or_create(email=email, defaults={
                "is_active": True,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            })

            if created:
                user.set_password(pwd)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user {email}"))
            else:
                # update flags
                updated = False
                if user.is_staff != is_staff:
                    user.is_staff = is_staff
                    updated = True
                if user.is_superuser != is_superuser:
                    user.is_superuser = is_superuser
                    updated = True
                if options.get("reset_passwords"):
                    user.set_password(pwd)
                    updated = True
                if updated:
                    user.save()
                    self.stdout.write(self.style.WARNING(f"Updated user {email}"))
                else:
                    self.stdout.write(f"User {email} exists")

            # ensure role assignments
            # clear existing dev roles then add specified
            for role in roles:
                UserRole.objects.get_or_create(user=user, role=role)
        self.stdout.write(self.style.SUCCESS("Dev users seeded."))

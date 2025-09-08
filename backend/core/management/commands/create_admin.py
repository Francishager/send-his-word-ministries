from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from users.models import User, Role

DEFAULT_PERMISSIONS = {
    "users_manage": True,
    "roles_manage": True,
    "reporting_read": True,
    "services_manage": True,
    "giving_manage": True,
    "donations_manage": True,
}


class Command(BaseCommand):
    help = "Create an admin user and ensure ADMIN role exists with full permissions."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Admin email")
        parser.add_argument("--password", required=True, help="Admin password")
        parser.add_argument(
            "--role-name",
            default="ADMIN",
            help="Role name to assign (default: ADMIN)",
        )
        parser.add_argument(
            "--inactive",
            action="store_true",
            help="Create the user as inactive (default: active)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["--email"] if "--email" in options else options["email"]
        password = options["--password"] if "--password" in options else options["password"]
        role_name = options.get("role_name") or options.get("--role-name") or "ADMIN"
        make_inactive = options.get("inactive", False)

        if not email or not password:
            raise CommandError("--email and --password are required")

        # Ensure role exists
        role, created_role = Role.objects.get_or_create(
            name=role_name,
            defaults={
                "description": "System administrator" if role_name == "ADMIN" else f"Auto-created role {role_name}",
                "permissions": DEFAULT_PERMISSIONS,
            },
        )
        if not created_role:
            # merge/ensure default permissions are present (do not override existing true flags)
            perms = role.permissions or {}
            perms = {**DEFAULT_PERMISSIONS, **perms}
            role.permissions = perms
            role.save(update_fields=["permissions"])

        # Ensure user exists
        user = User.objects.filter(email=email).first()
        if user:
            self.stdout.write(self.style.WARNING(f"User {email} already exists. Updating password and role assignment."))
            user.set_password(password)
            if not make_inactive:
                user.is_active = True
            user.save()
        else:
            user = User.objects.create_user(email=email, password=password, is_active=not make_inactive)
            self.stdout.write(self.style.SUCCESS(f"User created: {email}"))

        # Assign role
        if not user.roles.filter(id=role.id).exists():
            user.roles.add(role)
            self.stdout.write(self.style.SUCCESS(f"Assigned role {role.name} to {email}"))
        else:
            self.stdout.write(self.style.WARNING(f"User {email} already has role {role.name}"))

        self.stdout.write(self.style.SUCCESS("Admin setup complete."))

"""
Accounts – Models
-----------------
We extend Django's built-in AbstractUser so we get all the auth machinery
(password hashing, permissions, sessions) for free, and just add our own fields.

Why a custom user model?
  Django recommends always defining a custom user model at the start of a project.
  It's painful to switch later. Here we add a `role` field so we can distinguish
  between advertisers and platform admins.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Extended user model with role-based access.

    Roles:
      - ADVERTISER: can browse boards, make bookings, upload ads
      - ADMIN: full platform access, can manage boards and all bookings
    """

    class Role(models.TextChoices):
        ADVERTISER = "advertiser", "Advertiser"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADVERTISER)
    company_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Use email as the login field instead of username
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

"""
Accounts – Custom Permissions
------------------------------
DRF permission classes control who can access which views.
has_permission() runs on every request before the view logic.
"""

from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Grants access only to users with the ADMIN role."""

    message = "Access restricted to platform administrators."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsAdvertiser(BasePermission):
    """Grants access to advertisers and admins."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("advertiser", "admin")
        )

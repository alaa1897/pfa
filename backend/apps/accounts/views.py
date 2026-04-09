"""
Accounts – Views
----------------
ViewSets group related API actions together. Each ViewSet maps to a URL
and handles multiple HTTP methods (GET, POST, PUT, DELETE).
"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import User
from .serializers import UserRegistrationSerializer, UserProfileSerializer, AdminUserSerializer
from .permissions import IsAdminUser


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/accounts/register/
    
    Public endpoint — no auth required.
    Creates a new advertiser account and returns the user profile.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserProfileSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/v1/accounts/profile/  → returns logged-in user's profile
    PUT  /api/v1/accounts/profile/  → updates logged-in user's profile
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Always returns the currently authenticated user
        return self.request.user


class AdminUserListView(generics.ListAPIView):
    """
    GET /api/v1/accounts/users/
    
    Admin only. Lists all registered users.
    """
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

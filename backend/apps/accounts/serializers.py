"""
Accounts – Serializers
----------------------
Serializers convert between Python objects (Django models) and JSON.
Think of them as a two-way translator: model → JSON for API responses,
JSON → model for incoming requests.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Used when a new advertiser signs up."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "company_name", "phone", "password", "password_confirm",
        ]

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)  # Hashes the password — never store plain text
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Used for reading and updating a user's own profile."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "full_name", "company_name", "phone", "role", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "created_at"]


class AdminUserSerializer(serializers.ModelSerializer):
    """Used by admins to list all users — includes role and status."""

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "full_name", "company_name",
            "role", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

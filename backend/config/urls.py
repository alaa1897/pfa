"""
URL Configuration
-----------------
All API routes are prefixed with /api/v1/ so we can version the API later.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Django Admin (useful during development)
    path("admin/", admin.site.urls),

    # JWT Authentication endpoints
    # POST /api/auth/login/   → returns access + refresh tokens
    # POST /api/auth/refresh/ → returns a new access token
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # App-specific API routes
    path("api/v1/accounts/", include("apps.accounts.urls")),
    path("api/v1/boards/", include("apps.boards.urls")),
    path("api/v1/bookings/", include("apps.bookings.urls")),
    path("api/v1/ads/", include("apps.ads.urls")),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

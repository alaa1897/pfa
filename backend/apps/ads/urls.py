from django.urls import path
from . import views

urlpatterns = [
    path("", views.AdListView.as_view(), name="ad-list"),
    path("upload/", views.AdUploadView.as_view(), name="ad-upload"),
    path("<int:pk>/", views.AdDetailView.as_view(), name="ad-detail"),
]

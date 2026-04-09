"""
Boards – Views
"""

from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Board
from .serializers import BoardSerializer, BoardMapSerializer, BoardCreateUpdateSerializer
from apps.accounts.permissions import IsAdminUser


class BoardViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for boards.

    GET    /api/v1/boards/          → list all active boards
    GET    /api/v1/boards/<id>/     → board detail
    GET    /api/v1/boards/map/      → lightweight list for the map
    POST   /api/v1/boards/          → create board (admin only)
    PUT    /api/v1/boards/<id>/     → update board (admin only)
    DELETE /api/v1/boards/<id>/     → delete board (admin only)
    """

    queryset = Board.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["city", "status", "resolution"]
    search_fields = ["name", "city", "address"]
    ordering_fields = ["price_per_slot", "name", "created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return BoardCreateUpdateSerializer
        return BoardSerializer

    def get_permissions(self):
        # Anyone authenticated can read boards; only admins can write
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=["get"], url_path="map")
    def map_view(self, request):
        """
        GET /api/v1/boards/map/
        
        Returns only active boards with just the fields needed for map markers.
        This keeps the initial map load fast.
        """
        boards = Board.objects.filter(status=Board.Status.ACTIVE)
        serializer = BoardMapSerializer(boards, many=True, context={"request": request})
        return Response(serializer.data)

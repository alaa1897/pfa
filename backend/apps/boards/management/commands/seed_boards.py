"""
Management Command: seed_boards
--------------------------------
Run this after migrations to populate the database with demo boards
spread across Tunis so the map has real data to show.

Usage:
  python manage.py seed_boards
"""

from django.core.management.base import BaseCommand
from apps.boards.models import Board


DEMO_BOARDS = [
    {
        "name": "Avenue Habib Bourguiba — Centre",
        "description": "Prime location on the main boulevard, high foot traffic.",
        "latitude": 36.7992,
        "longitude": 10.1797,
        "address": "Avenue Habib Bourguiba, Tunis",
        "city": "Tunis",
        "resolution": Board.Resolution.HD,
        "width_cm": 400,
        "height_cm": 225,
        "price_per_slot": 120.00,
        "status": Board.Status.ACTIVE,
    },
    {
        "name": "Lac 1 — Business District",
        "description": "Facing the financial towers, premium corporate audience.",
        "latitude": 36.8320,
        "longitude": 10.2300,
        "address": "Les Berges du Lac, Tunis",
        "city": "Tunis",
        "resolution": Board.Resolution.UHD,
        "width_cm": 600,
        "height_cm": 338,
        "price_per_slot": 280.00,
        "status": Board.Status.ACTIVE,
    },
    {
        "name": "Ariana City Centre — Mall Entrance",
        "description": "Outside Ariana Mall main entrance, 20k daily visitors.",
        "latitude": 36.8625,
        "longitude": 10.1956,
        "address": "Rue de la Liberté, Ariana",
        "city": "Ariana",
        "resolution": Board.Resolution.PORTRAIT,
        "width_cm": 200,
        "height_cm": 356,
        "price_per_slot": 90.00,
        "status": Board.Status.ACTIVE,
    },
    {
        "name": "La Marsa Corniche",
        "description": "Seafront promenade, high weekend and summer traffic.",
        "latitude": 36.8876,
        "longitude": 10.3238,
        "address": "Avenue Taieb Mehiri, La Marsa",
        "city": "La Marsa",
        "resolution": Board.Resolution.HD,
        "width_cm": 400,
        "height_cm": 225,
        "price_per_slot": 150.00,
        "status": Board.Status.ACTIVE,
    },
    {
        "name": "Menzah 6 — Intersection",
        "description": "Busy residential crossroads, morning commuter traffic.",
        "latitude": 36.8450,
        "longitude": 10.1780,
        "address": "Rue Ibn Khaldoun, El Menzah",
        "city": "Tunis",
        "resolution": Board.Resolution.HD,
        "width_cm": 350,
        "height_cm": 197,
        "price_per_slot": 75.00,
        "status": Board.Status.ACTIVE,
    },
    {
        "name": "Bardo — Museum Square",
        "description": "Tourist area near Bardo National Museum.",
        "latitude": 36.8094,
        "longitude": 10.1338,
        "address": "Place du Bardo, Bardo",
        "city": "Bardo",
        "resolution": Board.Resolution.HD,
        "width_cm": 300,
        "height_cm": 169,
        "price_per_slot": 60.00,
        "status": Board.Status.ACTIVE,
    },
    {
        "name": "Carthage Airport — Arrivals Hall",
        "description": "International arrivals, premium traveller audience.",
        "latitude": 36.8510,
        "longitude": 10.2272,
        "address": "Aéroport International Tunis-Carthage",
        "city": "Tunis",
        "resolution": Board.Resolution.UHD,
        "width_cm": 500,
        "height_cm": 281,
        "price_per_slot": 350.00,
        "status": Board.Status.ACTIVE,
    },
    {
        "name": "Sousse — Centre Ville",
        "description": "Main street in Sousse city centre.",
        "latitude": 35.8256,
        "longitude": 10.6369,
        "address": "Avenue Habib Bourguiba, Sousse",
        "city": "Sousse",
        "resolution": Board.Resolution.HD,
        "width_cm": 400,
        "height_cm": 225,
        "price_per_slot": 95.00,
        "status": Board.Status.INACTIVE,
    },
]


class Command(BaseCommand):
    help = "Seeds the database with demo digital boards across Tunisia."

    def handle(self, *args, **options):
        created = 0
        for data in DEMO_BOARDS:
            board, was_created = Board.objects.get_or_create(
                name=data["name"],
                defaults=data,
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  Created: {board.name}"))
            else:
                self.stdout.write(f"  Already exists: {board.name}")

        self.stdout.write(
            self.style.SUCCESS(f"\nDone. {created} new boards created.")
        )

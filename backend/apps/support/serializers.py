from rest_framework import serializers
from .models import Ticket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    creationDate = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = TicketMessage
        fields = [
            "id",
            "body",
            "is_admin_reply",
            "created_at",
            "creationDate",
        ]


class TicketListSerializer(serializers.ModelSerializer):
    creationDate = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "subject",
            "status",
            "priority",
            "created_at",
            "creationDate",
            "updated_at",
        ]


class TicketDetailSerializer(serializers.ModelSerializer):
    creationDate = serializers.DateTimeField(source="created_at", read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "subject",
            "status",
            "priority",
            "created_at",
            "creationDate",
            "messages",
        ]
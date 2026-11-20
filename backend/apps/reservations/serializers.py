from django.utils import timezone
from rest_framework import serializers
from .models import TableReservation


class TableReservationSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    tableNumber = serializers.IntegerField(source="table_number")
    customerName = serializers.CharField(source="customer_name")
    customerMobile = serializers.CharField(source="customer_mobile")
    guestsCount = serializers.IntegerField(source="guests_count")
    reservationTime = serializers.CharField(source="reservation_time")
    createdAt = serializers.DateTimeField(source="created_at")
    timeCreated = serializers.SerializerMethodField()

    class Meta:
        model = TableReservation
        fields = [
            "id",
            "tableNumber",
            "customerName",
            "customerMobile",
            "guestsCount",
            "reservationTime",
            "notes",
            "source",
            "status",
            "createdAt",
            "timeCreated",
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_timeCreated(self, obj):
        if not obj.created_at:
            return ""
        local_dt = timezone.localtime(obj.created_at)
        return local_dt.strftime("%H:%M")
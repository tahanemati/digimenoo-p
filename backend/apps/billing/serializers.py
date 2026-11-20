from rest_framework import serializers
from .models import WalletTransaction, SubscriptionPlan, UserSubscription


class WalletTransactionSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    receiptUrl = serializers.SerializerMethodField()
    adminNote = serializers.CharField(source="admin_note", read_only=True)
    isSuccess = serializers.SerializerMethodField()

    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "amount",
            "type",
            "status",
            "isSuccess",
            "description",
            "adminNote",
            "receiptUrl",
            "createdAt",
        ]

    def get_receiptUrl(self, obj):
        if obj.receipt_image:
            return obj.receipt_image.url
        return ""

    def get_isSuccess(self, obj):
        return obj.status == WalletTransaction.Status.SUCCESS


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    durationMonths = serializers.IntegerField(source="duration_months")
    durationDays = serializers.IntegerField(source="duration_days")
    badgeText = serializers.CharField(source="badge_text")
    isPopular = serializers.BooleanField(source="is_popular")
    featuresList = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "durationMonths",
            "durationDays",
            "price",
            "description",
            "featuresList",
            "icon",
            "badgeText",
            "isPopular",
        ]

    def get_featuresList(self, obj):
        if not obj.features:
            return []
        return [line.strip() for line in obj.features.splitlines() if line.strip()]


class UserSubscriptionSerializer(serializers.ModelSerializer):
    planId = serializers.SerializerMethodField()
    name = serializers.CharField(source="plan_name")
    planName = serializers.CharField(source="plan_name")
    totalDays = serializers.IntegerField(source="total_days")
    durationDays = serializers.IntegerField(source="total_days")
    isTrial = serializers.BooleanField(source="is_trial")
    expireDate = serializers.DateTimeField(source="expire_date")

    class Meta:
        model = UserSubscription
        fields = [
            "id",
            "planId",
            "name",
            "planName",
            "totalDays",
            "durationDays",
            "isTrial",
            "expireDate",
        ]

    def get_planId(self, obj):
        return str(obj.plan_id) if obj.plan_id else None
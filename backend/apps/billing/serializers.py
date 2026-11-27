from rest_framework import serializers
from django.utils import timezone
from .models import WalletTransaction, SubscriptionPlan, UserSubscription
from .entitlements import TIER_ENTITLEMENTS


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
    price3m = serializers.SerializerMethodField()
    price6m = serializers.SerializerMethodField()
    price9m = serializers.SerializerMethodField()
    badgeText = serializers.CharField(source="badge_text")
    isPopular = serializers.BooleanField(source="is_popular")
    featuresList = serializers.SerializerMethodField()
    maxTemplates = serializers.SerializerMethodField()
    entitlements = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "tier",
            "name",
            "durationMonths",
            "durationDays",
            "price",
            "price3m",
            "price6m",
            "price9m",
            "description",
            "featuresList",
            "maxTemplates",
            "entitlements",
            "icon",
            "badgeText",
            "isPopular",
        ]

    def get_price3m(self, obj):
        return obj.get_price_for_months(3)

    def get_price6m(self, obj):
        return obj.get_price_for_months(6)

    def get_price9m(self, obj):
        return obj.get_price_for_months(9)

    def get_featuresList(self, obj):
        if not obj.features:
            return []
        return [line.strip() for line in obj.features.splitlines() if line.strip()]

    def get_maxTemplates(self, obj):
        spec = TIER_ENTITLEMENTS.get(obj.tier, TIER_ENTITLEMENTS["basic"])
        return spec["max_templates"]

    def get_entitlements(self, obj):
        spec = TIER_ENTITLEMENTS.get(obj.tier, TIER_ENTITLEMENTS["basic"])
        return spec["features"]


class UserSubscriptionSerializer(serializers.ModelSerializer):
    planId = serializers.SerializerMethodField()
    tier = serializers.SerializerMethodField()
    name = serializers.CharField(source="plan_name")
    planName = serializers.CharField(source="plan_name")
    totalDays = serializers.IntegerField(source="total_days")
    durationDays = serializers.IntegerField(source="total_days")
    isTrial = serializers.BooleanField(source="is_trial")
    isRevoked = serializers.BooleanField(source="is_revoked")
    isActive = serializers.SerializerMethodField()
    isExpired = serializers.SerializerMethodField()
    daysRemaining = serializers.SerializerMethodField()
    expireDate = serializers.DateTimeField(source="expire_date")
    allowedTemplates = serializers.SerializerMethodField()
    maxTemplates = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = [
            "id",
            "planId",
            "tier",
            "name",
            "planName",
            "totalDays",
            "durationDays",
            "isTrial",
            "isRevoked",
            "isActive",
            "isExpired",
            "daysRemaining",
            "expireDate",
            "maxTemplates",
            "allowedTemplates",
            "features",
        ]

    def get_planId(self, obj):
        return str(obj.plan_id) if obj.plan_id else None

    def get_isActive(self, obj):
        return obj.is_active_now

    def get_isExpired(self, obj):
        return obj.expire_date <= timezone.now()

    def get_daysRemaining(self, obj):
        if not obj.is_active_now:
            return 0
        return max(0, (obj.expire_date - timezone.now()).days)

    def get_tier(self, obj):
        if not obj.is_active_now:
            return "none"
        return obj.plan.tier if obj.plan else SubscriptionPlan.Tier.BASIC

    def _get_spec(self, obj):
        return TIER_ENTITLEMENTS.get(self.get_tier(obj), TIER_ENTITLEMENTS["none"])

    def get_maxTemplates(self, obj):
        return self._get_spec(obj)["max_templates"]

    def get_allowedTemplates(self, obj):
        return self._get_spec(obj)["allowed_templates"]

    def get_features(self, obj):
        return self._get_spec(obj)["features"]
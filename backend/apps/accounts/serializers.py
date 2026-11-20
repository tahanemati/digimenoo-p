from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class LoginSerializer(serializers.Serializer):
    mobile = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(mobile=attrs["mobile"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("شماره موبایل یا رمز عبور اشتباه است.")
        if not user.is_active:
            raise serializers.ValidationError("حساب کاربری غیرفعال است.")
        attrs["user"] = user
        return attrs


class CompleteProfileSerializer(serializers.Serializer):
    mobile = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField(required=False, allow_blank=True)
    lastName = serializers.CharField(required=False, allow_blank=True)
    fullName = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirmPassword = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    def validate(self, attrs):
        full_name = (
            attrs.get("fullName", "").strip()
            or f"{attrs.get('name', '').strip()} {attrs.get('lastName', '').strip()}".strip()
        )
        if not full_name:
            raise serializers.ValidationError("وارد کردن نام الزامی است.")

        password = attrs.get("password", "")
        confirm_password = attrs.get("confirmPassword", "")
        if password:
            if len(password) < 6:
                raise serializers.ValidationError("رمز عبور باید حداقل ۶ کاراکتر باشد.")
            if confirm_password and password != confirm_password:
                raise serializers.ValidationError("رمز عبور و تکرار آن مطابقت ندارند.")

        attrs["resolved_full_name"] = full_name
        return attrs

    def update(self, instance, validated_data):
        instance.full_name = validated_data["resolved_full_name"]
        if "email" in validated_data and validated_data["email"]:
            instance.email = validated_data["email"]
        password = validated_data.get("password")
        if password:
            instance.set_password(password)
        instance.has_contact = True
        instance.save()
        return instance


class TeamMemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    lastName = serializers.CharField(required=False, allow_blank=True, write_only=True)
    fullName = serializers.CharField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "mobile",
            "name",
            "lastName",
            "fullName",
            "role",
            "password",
            "isActive",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "is_active", "isActive"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        parts = (instance.full_name or "").strip().split(" ", 1)
        data["name"] = parts[0] if parts else ""
        data["lastName"] = parts[1] if len(parts) > 1 else ""
        data["fullName"] = instance.full_name or ""
        return data

    def validate_role(self, value):
        if value.lower() == User.Role.OWNER:
            raise serializers.ValidationError("نقش کارمند نمی‌تواند مدیر باشد.")
        return value.lower()

    def validate(self, attrs):
        password = attrs.get("password", "")
        if password and len(password) < 6:
            raise serializers.ValidationError(
                {"password": "رمز عبور باید حداقل ۶ کاراکتر باشد."}
            )
        return attrs

    def create(self, validated_data):
        name = validated_data.pop("name", "").strip()
        last_name = validated_data.pop("lastName", "").strip()
        full_name = validated_data.pop("fullName", "").strip() or f"{name} {last_name}".strip()
        password = validated_data.pop("password", "")

        if not password:
            raise serializers.ValidationError({"password": "رمز عبور الزامی است."})

        owner = self.context["request"].user
        return User.objects.create_user(
            owner=owner,
            full_name=full_name,
            has_contact=True,
            password=password,
            **validated_data,
        )

    def update(self, instance, validated_data):
        name = validated_data.pop("name", "").strip()
        last_name = validated_data.pop("lastName", "").strip()
        full_name = validated_data.pop("fullName", "").strip()
        password = validated_data.pop("password", "")

        if full_name:
            instance.full_name = full_name
        elif name or last_name:
            instance.full_name = f"{name} {last_name}".strip()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
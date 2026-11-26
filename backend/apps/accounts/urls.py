from django.urls import path
from .views import (
    SendOTPView,
    VerifyOTPView,
    LoginView,
    CompleteProfileView,
    DashboardStatusView,
    ForgotPasswordRequestView,
    ForgotPasswordVerifyView,
    ForgotPasswordResetView,
    StaffListCreateView,
    StaffToggleActiveView,
    TeamListCreateView,
    TeamDetailView,
    TeamToggleActiveView,
)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/otp/send/", SendOTPView.as_view(), name="otp-send"),
    path("auth/otp/resend/", SendOTPView.as_view(), name="otp-resend"),
    path("auth/otp/verify/", VerifyOTPView.as_view(), name="otp-verify"),
    path(
        "auth/complete-profile/",
        CompleteProfileView.as_view(),
        name="complete-profile",
    ),
    path(
        "auth/dashboard-status/",
        DashboardStatusView.as_view(),
        name="dashboard-status",
    ),
    path(
        "auth/forgot-password/request/",
        ForgotPasswordRequestView.as_view(),
        name="fp-request",
    ),
    path(
        "auth/forgot-password/verify/",
        ForgotPasswordVerifyView.as_view(),
        name="fp-verify",
    ),
    path(
        "auth/forgot-password/reset/",
        ForgotPasswordResetView.as_view(),
        name="fp-reset",
    ),
    path("staff/", StaffListCreateView.as_view(), name="staff-list-create"),
    path(
        "staff/<uuid:staff_id>/active/",
        StaffToggleActiveView.as_view(),
        name="staff-toggle-active",
    ),
    path("team/", TeamListCreateView.as_view(), name="team-list-create"),
    path(
        "team/<uuid:member_id>/",
        TeamDetailView.as_view(),
        name="team-detail",
    ),
    path(
        "team/<uuid:member_id>/active/",
        TeamToggleActiveView.as_view(),
        name="team-toggle-active",
    ),
    path("forgot-password/request/", ForgotPasswordRequestView.as_view(), name="forgot-password-request"),
    path("forgot-password/verify/", ForgotPasswordVerifyView.as_view(), name="forgot-password-verify"),
    path("forgot-password/reset/", ForgotPasswordResetView.as_view(), name="forgot-password-reset"),
]
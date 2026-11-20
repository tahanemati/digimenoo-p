from django.urls import path
from .views import (
    TicketListCreateView,
    TicketDetailView,
    TicketReplyView,
)

urlpatterns = [
    path("support/tickets/", TicketListCreateView.as_view(), name="support-tickets"),
    path("support/tickets/<uuid:ticket_id>/", TicketDetailView.as_view(), name="support-ticket-detail"),
    path("support/tickets/<uuid:ticket_id>/reply/", TicketReplyView.as_view(), name="support-ticket-reply"),
]
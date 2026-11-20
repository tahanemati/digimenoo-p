from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.responses import api_success, api_error
from .models import Ticket, TicketMessage
from .serializers import TicketListSerializer, TicketDetailSerializer


class TicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = Ticket.objects.filter(user=request.user)
        serializer = TicketListSerializer(tickets, many=True)

        stats = {
            "total": tickets.count(),
            "pending": tickets.filter(status=Ticket.Status.PENDING).count(),
            "answered": tickets.filter(status=Ticket.Status.ANSWERED).count(),
            "closed": tickets.filter(status=Ticket.Status.CLOSED).count(),
        }

        return api_success(
            {
                "items": serializer.data,
                "stats": stats,
            }
        )

    def post(self, request):
        subject = str(request.data.get("subject", "")).strip()
        body = str(request.data.get("body", "")).strip()
        priority = request.data.get("priority", 0)

        if not subject or not body:
            return api_error("موضوع و متن پیام الزامی است.")

        try:
            priority_int = int(priority)
        except (ValueError, TypeError):
            priority_int = 0

        with transaction.atomic():
            ticket = Ticket.objects.create(
                user=request.user,
                subject=subject,
                status=Ticket.Status.PENDING,
                priority=priority_int,
            )
            TicketMessage.objects.create(
                ticket=ticket,
                sender=request.user,
                body=body,
                is_admin_reply=False,
            )

        return api_success(
            TicketDetailSerializer(ticket).data,
            message="تیکت شما با موفقیت ثبت شد.",
            status_code=status.HTTP_201_CREATED,
        )


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)
        return api_success(TicketDetailSerializer(ticket).data)


class TicketReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)

        if ticket.status == Ticket.Status.CLOSED:
            return api_error("این تیکت بسته شده و امکان ارسال پیام جدید وجود ندارد.")

        body = str(request.data.get("body", "")).strip()
        if not body:
            return api_error("متن پیام نمی‌تواند خالی باشد.")

        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            body=body,
            is_admin_reply=False,
        )
        ticket.refresh_from_db()

        return api_success(
            TicketDetailSerializer(ticket).data,
            message="پیام شما ارسال شد.",
        )
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Ticket(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار پاسخ"
        ANSWERED = "answered", "پاسخ داده شده"
        CLOSED = "closed", "بسته شده"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tickets",
        verbose_name="کاربر",
    )
    subject = models.CharField(max_length=255, verbose_name="موضوع تیکت")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت",
    )
    priority = models.IntegerField(default=0, verbose_name="اولویت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        ordering = ["-updated_at", "-created_at"]
        verbose_name = "تیکت پشتیبانی"
        verbose_name_plural = "تیکت‌های پشتیبانی"

    def __str__(self):
        return f"{self.subject} ({self.user.mobile})"


class TicketMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="تیکت",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="ارسال‌کننده",
    )
    body = models.TextField(verbose_name="متن پیام")
    is_admin_reply = models.BooleanField(
        default=False, verbose_name="پاسخ تیم پشتیبانی"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان ارسال")

    class Meta:
        ordering = ["created_at"]
        verbose_name = "پیام تیکت"
        verbose_name_plural = "پیام‌های تیکت"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)

        if is_new and self.ticket.status != Ticket.Status.CLOSED:
            new_status = (
                Ticket.Status.ANSWERED
                if self.is_admin_reply
                else Ticket.Status.PENDING
            )
            Ticket.objects.filter(pk=self.ticket_id).update(
                status=new_status,
                updated_at=timezone.now(),
            )

    def __str__(self):
        sender_type = "پشتیبانی" if self.is_admin_reply else "کاربر"
        return f"{sender_type}: {self.body[:40]}"
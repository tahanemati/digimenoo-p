from django.contrib import admin
from .models import Ticket, TicketMessage


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 1
    fields = ("is_admin_reply", "body", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("subject", "user_info", "status", "updated_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("subject", "user__mobile", "user__full_name", "messages__body")
    readonly_fields = ("user", "created_at", "updated_at")
    inlines = [TicketMessageInline]
    actions = ["close_selected_tickets", "reopen_selected_tickets"]

    @admin.display(description="کاربر")
    def user_info(self, obj):
        name = obj.user.full_name or "بدون نام"
        return f"{name} ({obj.user.mobile})"

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in instances:
            if isinstance(obj, TicketMessage) and obj._state.adding:
                obj.is_admin_reply = True
                if not obj.sender:
                    obj.sender = request.user
            obj.save()
        for obj in formset.deleted_objects:
            obj.delete()
        formset.save_m2m()

    @admin.action(description="🔒 بستن تیکت‌های انتخاب‌شده")
    def close_selected_tickets(self, request, queryset):
        updated = queryset.update(status=Ticket.Status.CLOSED)
        self.message_user(request, f"{updated} تیکت بسته شد.")

    @admin.action(description="🔓 بازگشایی تیکت‌های انتخاب‌شده")
    def reopen_selected_tickets(self, request, queryset):
        updated = queryset.update(status=Ticket.Status.PENDING)
        self.message_user(request, f"{updated} تیکت بازگشایی شد.")
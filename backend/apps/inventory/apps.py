from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.inventory"
    verbose_name = "انبارداری و مواد اولیه"

    def ready(self):
        import apps.inventory.signals  # noqa: F401
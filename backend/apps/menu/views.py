from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.common.responses import api_success, api_error
from apps.restaurants.models import Restaurant
from apps.restaurants.views import get_user_restaurant
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        categories = Category.objects.filter(restaurant=restaurant)
        serializer = CategorySerializer(categories, many=True)
        return api_success(serializer.data)

    def post(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error("دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN)

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = CategorySerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("اطلاعات دسته‌بندی نامعتبر است.", serializer.errors)

        category = serializer.save(restaurant=restaurant)
        return api_success(
            CategorySerializer(category).data,
            message="دسته‌بندی با موفقیت ایجاد شد.",
            status_code=status.HTTP_201_CREATED,
        )


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, category_id):
        if request.user.role != User.Role.OWNER:
            return api_error("دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN)

        restaurant = get_user_restaurant(request.user)
        category = get_object_or_404(Category, id=category_id, restaurant=restaurant)

        serializer = CategorySerializer(category, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_error("اطلاعات دسته‌بندی نامعتبر است.", serializer.errors)

        serializer.save()
        return api_success(serializer.data, message="دسته‌بندی ویرایش شد.")

    def delete(self, request, category_id):
        if request.user.role != User.Role.OWNER:
            return api_error("دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN)

        restaurant = get_user_restaurant(request.user)
        category = get_object_or_404(Category, id=category_id, restaurant=restaurant)
        category.delete()
        return api_success(message="دسته‌بندی و محصولات آن حذف شدند.")


class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        products = Product.objects.filter(restaurant=restaurant).select_related("category")
        serializer = ProductSerializer(products, many=True)
        return api_success(serializer.data)

    def post(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error("دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN)

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProductSerializer(
            data=request.data, context={"restaurant": restaurant}
        )
        if not serializer.is_valid():
            return api_error("اطلاعات محصول نامعتبر است.", serializer.errors)

        product = serializer.save(restaurant=restaurant)
        return api_success(
            ProductSerializer(product).data,
            message="محصول با موفقیت ایجاد شد.",
            status_code=status.HTTP_201_CREATED,
        )


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, product_id):
        if request.user.role not in [User.Role.OWNER, User.Role.CASHIER]:
            return api_error("دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN)

        restaurant = get_user_restaurant(request.user)
        product = get_object_or_404(Product, id=product_id, restaurant=restaurant)

        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True,
            context={"restaurant": restaurant},
        )
        if not serializer.is_valid():
            return api_error("اطلاعات محصول نامعتبر است.", serializer.errors)

        serializer.save()
        return api_success(serializer.data, message="محصول ویرایش شد.")

    def delete(self, request, product_id):
        if request.user.role != User.Role.OWNER:
            return api_error("دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN)

        restaurant = get_user_restaurant(request.user)
        product = get_object_or_404(Product, id=product_id, restaurant=restaurant)
        if product.image:
            product.image.delete(save=False)
        product.delete()
        return api_success(message="محصول با موفقیت حذف شد.")


class ProductImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_id):
        if request.user.role != User.Role.OWNER:
            return api_error("دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN)

        restaurant = get_user_restaurant(request.user)
        product = get_object_or_404(Product, id=product_id, restaurant=restaurant)

        file_obj = request.FILES.get("file")
        if not file_obj:
            return api_error("فایل تصویر ارسال نشده است.")

        # پاک کردن عکس قبلی از دیسک برای جلوگیری از اشغال فضا
        if product.image:
            product.image.delete(save=False)

        product.image = file_obj
        product.save()
        product.image_url = product.image.url
        product.save(update_fields=["image_url"])

        return api_success(
            {"imageUrl": product.image.url, "url": product.image.url},
            message="تصویر محصول با موفقیت آپلود شد.",
        )


# ==========================================
# مسیرهای عمومی برای منوی مشتری (بدون نیاز به توکن)
# ==========================================
class PublicCategoryListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, slug):
        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        categories = Category.objects.filter(restaurant=restaurant)
        return api_success(CategorySerializer(categories, many=True).data)


class PublicProductListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, slug):
        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        products = Product.objects.filter(restaurant=restaurant).select_related("category")
        return api_success(ProductSerializer(products, many=True).data)
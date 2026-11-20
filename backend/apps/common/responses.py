# apps/common/responses.py
from rest_framework.response import Response
from rest_framework import status


def api_success(data=None, message="عملیات با موفقیت انجام شد", status_code=status.HTTP_200_OK):
    return Response(
        {
            "data": data,
            "isSuccedded": True,
            "message": message,
        },
        status=status_code,
    )


def api_error(message="خطایی رخ داد", data=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {
            "data": data,
            "isSuccedded": False,
            "message": message,
        },
        status=status_code,
    )
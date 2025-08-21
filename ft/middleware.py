from datetime import UTC, datetime
from os import getpid
from time import perf_counter
from uuid import uuid4
from threading import get_ident, get_native_id
from itertools import count
from django.utils import timezone


counter = count(1)


def outer_middleware(get_response):
    def middleware(request):
        perf_start = perf_counter()
        datetime_start = datetime.now(UTC)

        if not request.headers.get("X-Django-Request-ID"):
            request.META["HTTP_X_DJANGO_REQUEST_ID"] = str(next(counter))

        response = get_response(request)

        datetime_end = datetime.now(UTC)
        perf_end = perf_counter()
        elapsed_milliseconds = (perf_end - perf_start) * 1000

        response["X-Django-Python-Thread-ID"] = str(get_ident())
        response["X-Django-Native-Thread-ID"] = str(get_native_id())
        response["X-Django-Python-Process-ID"] = str(getpid())

        response["X-Django-Request-ID"] = request.META["HTTP_X_DJANGO_REQUEST_ID"]
        response["X-Django-Request-Start"] = datetime_start.isoformat()
        response["X-Django-Request-End"] = datetime_end.isoformat()
        response["X-Django-Perf-Time-MS"] = f"{elapsed_milliseconds:.4f}"

        return response

    return middleware

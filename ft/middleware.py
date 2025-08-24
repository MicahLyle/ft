from datetime import UTC, datetime
from itertools import count
from os import getpid
from threading import get_ident, get_native_id
from time import perf_counter
from uuid import uuid4

from django.http import HttpResponse
from django.utils import timezone

from ft.instrumentation import selected_counter

counter = count(1)


def outer_middleware(get_response):
    def middleware(request):
        perf_start = perf_counter()
        datetime_start = datetime.now(UTC)

        if not request.headers.get("X-Django-Request-ID"):
            request.META["HTTP_X_DJANGO_REQUEST_ID"] = str(next(counter))

        c1: int | None = None
        c2: int | None = None
        c3: int | None = None
        c4: int | None = None
        did_increment: bool = False

        response: HttpResponse | None = None

        python_thread_id = get_ident()
        native_thread_id = get_native_id()
        process_id = getpid()

        try:
            _ctr = selected_counter
            c1 = _ctr.read()
            _inc_before, _inc_after = _ctr.inc()
            did_increment = True
            c2 = _inc_after
            response = get_response(request)
        finally:
            if did_increment:
                _dec_before, _dec_after = _ctr.dec()
                c3 = _dec_before
                c4 = _ctr.read()

        datetime_end = datetime.now(UTC)
        perf_end = perf_counter()
        elapsed_milliseconds = (perf_end - perf_start) * 1000

        response["X-Django-Python-Thread-ID"] = str(python_thread_id)
        response["X-Django-Native-Thread-ID"] = str(native_thread_id)
        response["X-Django-Python-Process-ID"] = str(process_id)

        response["X-Django-Request-ID"] = request.META["HTTP_X_DJANGO_REQUEST_ID"]
        response["X-Django-Request-Start"] = datetime_start.isoformat()
        response["X-Django-Request-End"] = datetime_end.isoformat()
        response["X-Django-Perf-Time-MS"] = f"{elapsed_milliseconds:.4f}"

        if c1 is None:
            response["X-Django-Concurrency-Start-Before"] = "-1"
        if c2 is None:
            response["X-Django-Concurrency-Start-After"] = "-1"
        if c3 is None:
            response["X-Django-Concurrency-End-Before"] = "-1"
        if c4 is None:
            response["X-Django-Concurrency-End-After"] = "-1"

        if c1 is not None:
            response["X-Django-Concurrency-Start-Before"] = str(c1)
        if c2 is not None:
            response["X-Django-Concurrency-Start-After"] = str(c2)
        if c3 is not None:
            response["X-Django-Concurrency-End-Before"] = str(c3)
        if c4 is not None:
            response["X-Django-Concurrency-End-After"] = str(c4)

        return response

    return middleware

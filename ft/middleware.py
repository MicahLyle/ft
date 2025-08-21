def print_request_middleware(get_response):
    def middleware(request):
        print(request)
        return get_response(request)

    return middleware


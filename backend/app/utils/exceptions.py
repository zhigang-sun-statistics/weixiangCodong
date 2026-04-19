class AppException(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, resource: str, resource_id: int | str):
        super().__init__(404, f"{resource} with id '{resource_id}' not found")


class ValidationException(AppException):
    def __init__(self, message: str):
        super().__init__(400, message)


class DependencyException(AppException):
    def __init__(self, message: str):
        super().__init__(400, message)


class AIServiceException(AppException):
    def __init__(self, message: str):
        super().__init__(503, message)

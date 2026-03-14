
class AppDomainError(Exception):
    def __init__(self, message: str = ""):
        self.message = message
        super().__init__(message)

class UserNotFoundError(AppDomainError):
    def __init__(self, identifier: str):
        self.identifier = identifier
        super().__init__(f"User with identifier {identifier} not founded.")

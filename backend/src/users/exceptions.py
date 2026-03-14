from src.middlewars.exceptions import AppDomainError

class DataAccessException(AppDomainError):
    pass

class RegistrationFailedException(AppDomainError):
    pass
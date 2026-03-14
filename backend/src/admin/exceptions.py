from src.middlewars.exceptions import AppDomainError


class NotFoundException(AppDomainError):
    pass

class BanException(AppDomainError):
    pass

class UnBanException(AppDomainError):
    pass
from src.middlewars.exceptions import AppDomainError

class EmailAlreadyExistsError(AppDomainError):
    def __init__(self, email: str):
        self.email = email
        self.message = "This email address alredy exists"
        super().__init__(self.message)


class InvalidRefreshTokenException(AppDomainError):
    pass

class InvalidTokenException(AppDomainError):
    pass

# class ExpiredTokenException(BusinessRuleException):
#     pass

# class EmailException(BusinessRuleException):
#     pass
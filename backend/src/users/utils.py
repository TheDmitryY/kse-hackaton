def mask_email(email: str) -> str:
    try:
        name, domain = email.split("@")
        if len(name) <= 2:
            masked_name = f"{name[0]}"
        else:
            masked_name = f"{name[0]}{'*' * (len(name) - 2)}{name[-1]}"
        return f"{masked_name}@{domain}"
    except ValueError:
        return "***@***"
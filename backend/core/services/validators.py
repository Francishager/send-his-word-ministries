import re
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError

NAME_RE = re.compile(r"[A-Za-z]{2,}")
URL_RE = re.compile(r"https?://", re.I)
SCRIPT_RE = re.compile(r"</?script", re.I)
REPEAT_CHAR_RE = re.compile(r"^(.)\1{5,}$")


def is_valid_email(value: str) -> bool:
    try:
        django_validate_email(value)
        return True
    except ValidationError:
        return False


def is_valid_name(value: str) -> bool:
    if not value:
        return False
    val = value.strip()
    if len(val) < 2:
        return False
    if not NAME_RE.search(val):
        return False
    return True


def is_human_text(value: str, *, optional: bool = True) -> bool:
    if not value:
        return optional
    t = value.strip()
    if len(t) < 6:
        return False
    if not re.search(r"[A-Za-z]", t):
        return False
    if URL_RE.search(t):
        return False
    if SCRIPT_RE.search(t):
        return False
    if REPEAT_CHAR_RE.match(t):
        return False
    return True

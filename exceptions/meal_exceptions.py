from http import HTTPStatus
from fastapi import HTTPException


class MealNotFoundException(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=HTTPStatus.NOT_FOUND,
            detail=message
        )
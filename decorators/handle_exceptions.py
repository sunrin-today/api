from functools import wraps
from fastapi.responses import JSONResponse

from schemes.meal_scheme import ErrorScheme
from exceptions.meal_exceptions import MealNotFoundException

def handle_exceptions(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            print(f"Exception type: {type(e)}")  # 실제로 어떤 예외가 발생하는지 확인
            print(f"Exception message: {str(e)}")

            raise e

    return wrapper

from fastapi import Query
from typing import Annotated

from app.database import get_db

# Common Dependency Types
# Using Annotated types to make dependency injection clean and modern
DatabaseSession = Annotated[get_db, None]


class CommonQueryParams:
    """Reusable dependency injection parameter configuration."""
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
        limit: int = Query(10, ge=1, le=100, description="Page limit max 100")
    ):
        self.skip = skip
        self.limit = limit

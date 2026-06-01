from fastapi import HTTPException, status


class BusinessRuleException(HTTPException):
    """Base exception for custom business rule violations in the system."""
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class SKUCollisionException(BusinessRuleException):
    def __init__(self, sku: str):
        super().__init__(
            detail=f"Product with SKU '{sku}' already exists. SKU must be unique.",
            status_code=status.HTTP_409_CONFLICT
        )


class EmailCollisionException(BusinessRuleException):
    def __init__(self, email: str):
        super().__init__(
            detail=f"Customer with email '{email}' already exists. Email must be unique.",
            status_code=status.HTTP_409_CONFLICT
        )


class ResourceNotFoundException(BusinessRuleException):
    def __init__(self, resource: str, identifier: any):
        super().__init__(
            detail=f"{resource} with identifier '{identifier}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )


class InsufficientStockException(BusinessRuleException):
    def __init__(self, product_name: str, requested: int, available: int):
        super().__init__(
            detail=f"Insufficient stock for product '{product_name}'. Requested: {requested}, Available: {available}."
        )


class EmptyOrderException(BusinessRuleException):
    def __init__(self):
        super().__init__(
            detail="Order must contain at least one item with a valid product."
        )

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional


# ==========================================
# PRODUCT SCHEMAS
# ==========================================
class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50, description="Unique Stock Keeping Unit")
    name: str = Field(..., min_length=1, max_length=150, description="Name of the product")
    description: Optional[str] = Field(None, max_length=500, description="Optional brief description")
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Price of the product, must be greater than 0")
    quantity_in_stock: int = Field(..., ge=0, description="In-stock quantity, cannot be negative")

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: str) -> str:
        v_stripped = v.strip().upper()
        if not v_stripped.isalnum() and "-" not in v_stripped and "_" not in v_stripped:
            raise ValueError("SKU must contain only alphanumeric characters, dashes, or underscores")
        return v_stripped


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=3, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_stripped = v.strip().upper()
        if not v_stripped.isalnum() and "-" not in v_stripped and "_" not in v_stripped:
            raise ValueError("SKU must contain only alphanumeric characters, dashes, or underscores")
        return v_stripped


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100, description="Customer's full name")
    email: EmailStr = Field(..., description="Unique and valid email address")
    phone_number: Optional[str] = Field(None, max_length=20, description="Optional contact number")


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# ORDER SCHEMAS
# ==========================================
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0, description="ID of product being ordered")
    quantity: int = Field(..., gt=0, description="Quantity being ordered, must be greater than 0")


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductResponse

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0, description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order, at least 1 item is required")


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    created_at: datetime
    status: str
    total_amount: Decimal
    items: List[OrderItemResponse]
    customer: CustomerResponse

    class Config:
        from_attributes = True

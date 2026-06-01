export const BACKEND_FILES = [
  {
    name: "requirements.txt",
    path: "backend/requirements.txt",
    language: "text",
    description: "Defines python library dependencies for production alignment, pinning packages for stability.",
    content: `fastapi>=0.110.0
uvicorn>=0.28.0
sqlalchemy>=2.0.28
psycopg2-binary>=2.9.9
pydantic[email]>=2.6.4
pydantic-settings>=2.2.1
python-dotenv>=1.0.1
alembic>=1.13.1`
  },
  {
    name: "config.py",
    path: "backend/app/config.py",
    language: "python",
    description: "Uses Pydantic BaseSettings to securely parse environment variables and compile the database URI.",
    content: `import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory & Order Management System"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "inventory_db"
    POSTGRES_PORT: str = "5432"
    
    # Optional full URL override
    DATABASE_URL: str | None = None

    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Load from environment variables and optionally a .env file
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings() `
  },
  {
    name: "database.py",
    path: "backend/app/database.py",
    language: "python",
    description: "Sets up the SQLAlchemy 2.0 Engine and implements dependency injection for thread-safe session scoping.",
    content: `from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# In production, we'd use pool_pre_ping to check connection health
engine = create_engine(
    settings.get_database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    Automatically closes the session after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`
  },
  {
    name: "models.py",
    path: "backend/app/models.py",
    language: "python",
    description: "SqlAlchemy 2.0 declarative database models defining schema architecture, unique constraints, and cascades.",
    content: `import datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, ForeignKey, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="customer", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)  # PENDING, COMPLETED, CANCELLED
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items", lazy="joined")`
  },
  {
    name: "schemas.py",
    path: "backend/app/schemas.py",
    language: "python",
    description: "Pydantic V2 Schemas for robust payloads validation, email string assertions, and serializations.",
    content: `from datetime import datetime
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
        from_attributes = True`
  },
  {
    name: "exceptions.py",
    path: "backend/app/exceptions.py",
    language: "python",
    description: "Definition of custom BusinessRuleExceptions routed to professional payload models via HTTP handles.",
    content: `from fastapi import HTTPException, status


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
        )`
  },
  {
    name: "crud.py",
    path: "backend/app/crud.py",
    language: "python",
    description: "SQLAlchemy 2.0 operations utilizing database row locks (with_for_update) to guarantee transaction integrity.",
    content: `from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from app import models, schemas, exceptions
from app.services import OrderService


# ==========================================
# PRODUCT CRUD SERVICES
# ==========================================
def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
    return db.scalars(select(models.Product).where(models.Product.sku == sku.upper())).first()


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.get(models.Product, product_id)
    if not product:
        raise exceptions.ResourceNotFoundException("Product", product_id)
    return product


def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
    return list(db.scalars(select(models.Product).offset(skip).limit(limit)).all())


def create_product(db: Session, product_in: schemas.ProductCreate) -> models.Product:
    # 1. Enforce business rule: SKU must be unique
    existing = get_product_by_sku(db, product_in.sku)
    if existing:
        raise exceptions.SKUCollisionException(product_in.sku)
    
    # 2. Assert quantity_in_stock cannot be negative (already guarded by Pydantic but double checked at DB boundary)
    if product_in.quantity_in_stock < 0:
        raise ValueError("Product stock quantity cannot be negative.")

    db_product = models.Product(
        sku=product_in.sku.upper(),
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
        quantity_in_stock=product_in.quantity_in_stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product_in: schemas.ProductUpdate) -> models.Product:
    db_product = get_product(db, product_id)
    
    update_data = product_in.model_dump(exclude_unset=True)
    
    # If updating SKU, check for collisions
    if "sku" in update_data:
        new_sku = update_data["sku"].upper()
        if new_sku != db_product.sku:
            existing = get_product_by_sku(db, new_sku)
            if existing:
                raise exceptions.SKUCollisionException(new_sku)
            update_data["sku"] = new_sku

    for field, value in update_data.items():
        setattr(db_product, field, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> models.Product:
    db_product = get_product(db, product_id)
    db.delete(db_product)
    db.commit()
    return db_product


# ==========================================
# CUSTOMER CRUD SERVICES
# ==========================================
def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.scalars(select(models.Customer).where(models.Customer.email == email.lower())).first()


def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise exceptions.ResourceNotFoundException("Customer", customer_id)
    return customer


def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Customer]:
    return list(db.scalars(select(models.Customer).offset(skip).limit(limit)).all())


def create_customer(db: Session, customer_in: schemas.CustomerCreate) -> models.Customer:
    # Enforce uniqueness of Email
    existing = get_customer_by_email(db, customer_in.email)
    if existing:
        raise exceptions.EmailCollisionException(customer_in.email)

    db_customer = models.Customer(
        full_name=customer_in.full_name,
        email=customer_in.email.lower(),
        phone_number=customer_in.phone_number
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int) -> models.Customer:
    db_customer = get_customer(db, customer_id)
    db.delete(db_customer)
    db.commit()
    return db_customer


# ==========================================
# ORDER CRUD SERVICES
# ==========================================
def get_order(db: Session, order_id: int) -> models.Order:
    order = db.get(models.Order, order_id)
    if not order:
        raise exceptions.ResourceNotFoundException("Order", order_id)
    return order


def get_orders(db: Session, skip: int = 0, limit: int = 100) -> List[models.Order]:
    return list(db.scalars(
        select(models.Order)
        .order_by(models.Order.created_at.desc())
        .offset(skip).limit(limit)
    ).all())


def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    return OrderService.create_order(db, order_in)


def delete_order(db: Session, order_id: int) -> models.Order:
    """
    Cancelling/Deleting an order in production must restore inventory stock 
    quantities to products in a locked transaction sequence.
    """
    db_order = get_order(db, order_id)
    
    # Concurrency Lock & Replenish Stock
    for item in db_order.items:
        stmt = select(models.Product).where(models.Product.id == item.product_id).with_for_update()
        product = db.scalars(stmt).first()
        if product:
            product.quantity_in_stock += item.quantity
            
    db.delete(db_order)
    db.commit()
    return db_order`
  },
  {
    name: "services.py",
    path: "backend/app/services.py",
    language: "python",
    description: "Multi-step Order Service layer orchestration with strict validation checks, stock deduction, and transaction safeguards.",
    content: `import logging
from decimal import Decimal
from typing import List, Generator
from sqlalchemy.orm import Session
from sqlalchemy import select

from app import models, schemas, exceptions

logger = logging.getLogger("app.services")

class OrderService:
    @staticmethod
    def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
        """
        Service layer implementation for safe Order Creation.
        Ensures strict business rules and sequential steps:
        1. Check customer exists
        2. Check products exist
        3. Check inventory available
        4. Calculate total amount
        5. Reduce inventory stock
        6. Create order
        7. Create order items
        """
        logger.info(f"Initiating order creation service for Customer ID {order_in.customer_id}")

        try:
            # 1. Check customer exists
            customer = db.get(models.Customer, order_in.customer_id)
            if not customer:
                raise exceptions.ResourceNotFoundException("Customer", order_in.customer_id)

            if not order_in.items:
                raise exceptions.EmptyOrderException()

            consolidated_items = {}
            for item in order_in.items:
                if item.product_id <= 0:
                    raise exceptions.BusinessRuleException(
                        f"Invalid product ID: {item.product_id}. IDs must be positive integers."
                    )
                if item.quantity <= 0:
                    raise exceptions.BusinessRuleException(
                        f"Invalid quantity: {item.quantity} for Product ID {item.product_id}. Quantity must be positive."
                    )
                consolidated_items[item.product_id] = consolidated_items.get(item.product_id, 0) + item.quantity

            # 2. Check products exist
            product_ids = list(consolidated_items.keys())
            stmt = select(models.Product).where(models.Product.id.in_(product_ids)).with_for_update()
            products_by_id = {p.id: p for p in db.scalars(stmt).all()}

            missing_product_ids = [pid for pid in product_ids if pid not in products_by_id]
            if missing_product_ids:
                missing_str = ", ".join(map(str, missing_product_ids))
                raise exceptions.ResourceNotFoundException(
                    "Products", 
                    f"Product IDs [{missing_str}] do not exist in the catalog."
                )

            # 3. Check inventory available & 4. Calculate total amount
            running_total = Decimal("0.00")
            for product_id, ordered_qty in consolidated_items.items():
                product = products_by_id[product_id]
                
                # Check stock limits
                if ordered_qty > product.quantity_in_stock:
                    raise exceptions.InsufficientStockException(
                        product_name=product.name,
                        requested=ordered_qty,
                        available=product.quantity_in_stock
                    )
                
                # Calculate running total amount
                running_total += product.price * Decimal(ordered_qty)

            # 5. Reduce inventory stock
            for product_id, ordered_qty in consolidated_items.items():
                product = products_by_id[product_id]
                product.quantity_in_stock -= ordered_qty
                db.add(product)

            # 6. Create order
            db_order = models.Order(
                customer_id=customer.id,
                status="COMPLETED",
                total_amount=running_total
            )
            db.add(db_order)
            db.flush()

            # 7. Create order items
            for product_id, ordered_qty in consolidated_items.items():
                product = products_by_id[product_id]
                db_item = models.OrderItem(
                    order_id=db_order.id,
                    product_id=product.id,
                    quantity=ordered_qty,
                    unit_price=product.price
                )
                db.add(db_item)

            db.commit()
            db.refresh(db_order)
            logger.info(f"Successfully processed Order ID {db_order.id}")
            return db_order

        except Exception as e:
            db.rollback()
            logger.error(f"Transaction aborted. Rolled back order. Error: {str(e)}")
            raise e`
  },
  {
    name: "dependencies.py",
    path: "backend/app/dependencies.py",
    language: "python",
    description: "FastAPI dependencies configuring scoped sessions and unified paginated query handles.",
    content: `from fastapi import Query
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
        self.limit = limit`
  },
  {
    name: "products.py",
    path: "backend/app/routers/products.py",
    language: "python",
    description: "FastAPI router implementation mapping product endpoints to CRUD services.",
    content: `from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.database import get_db
from app.dependencies import CommonQueryParams

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product.
    Enforces unique SKU values and non-negative initial stock.
    """
    return crud.create_product(db, product)


@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(
    commons: CommonQueryParams = Depends(),
    db: Session = Depends(get_db)
):
    """
    Fetch products with standard database pagination.
    """
    return crud.get_products(db, skip=commons.skip, limit=commons.limit)


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieve details of a single product by its database ID.
    Raises 404 if the product doesn't exist.
    """
    return crud.get_product(db, product_id)


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Update attributes of an existing product.
    If the SKU is modified, validations verify it does not conflict with another product.
    """
    return crud.update_product(db, product_id=product_id, product_in=product)


@router.delete("/{product_id}", response_model=schemas.ProductResponse)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Delete a product from the database catalog.
    Raises 404 if the product identifier is missing.
    """
    return crud.delete_product(db, product_id=product_id)`
  },
  {
    name: "customers.py",
    path: "backend/app/routers/customers.py",
    language: "python",
    description: "FastAPI router implementation mapping customer endpoints to CRUD services.",
    content: `from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.database import get_db
from app.dependencies import CommonQueryParams

router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.post("/", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    """
    Register a new customer.
    Enforces unique email constraints in the system database.
    """
    return crud.create_customer(db, customer)


@router.get("/", response_model=List[schemas.CustomerResponse])
def get_customers(
    commons: CommonQueryParams = Depends(),
    db: Session = Depends(get_db)
):
    """
    Fetch listed customers with standard database pagination.
    """
    return crud.get_customers(db, skip=commons.skip, limit=commons.limit)


@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer_by_id(customer_id: int, db: Session = Depends(get_db)):
    """
    Retrieve contact profile details of a single customer by ID.
    Raises 404 if the customer identifier is not present.
    """
    return crud.get_customer(db, customer_id)


@router.delete("/{customer_id}", response_model=schemas.CustomerResponse)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Delete a customer profile.
    Deletes related order logs to preserve database constraints (ondelete cascade).
    """
    return crud.delete_customer(db, customer_id=customer_id)`
  },
  {
    name: "orders.py",
    path: "backend/app/routers/orders.py",
    language: "python",
    description: "FastAPI router implementation mapping order endpoints to database state services.",
    content: `from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.database import get_db
from app.dependencies import CommonQueryParams

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Submit a purchase order.
    Executes transaction structures in SQL to verify stock, 
    reduce inventory levels, and calculate totals automatically.
    """
    return crud.create_order(db, order)


@router.get("/", response_model=List[schemas.OrderResponse])
def get_orders(
    commons: CommonQueryParams = Depends(),
    db: Session = Depends(get_db)
):
    """
    Fetch order histories with standard database pagination.
    """
    return crud.get_orders(db, skip=commons.skip, limit=commons.limit)


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    """
    Retrieve specific details of an existing purchase order, including item lists and prices.
    Raises 404 if the order cannot be found.
    """
    return crud.get_order(db, order_id)


@router.delete("/{order_id}", response_model=schemas.OrderResponse)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Cancel and delete an order.
    Restores product inventory stock levels inside a safe database transaction.
    """
    return crud.delete_order(db, order_id=order_id)`
  },
  {
    name: "main.py",
    path: "backend/app/main.py",
    language: "python",
    description: "FastAPI application startup file aggregating routes, custom business logic error handlers, and timing metadata.",
    content: `from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.config import settings
from app.exceptions import BusinessRuleException
from app.routers import products, customers, orders
from app.database import engine, Base

# Attempt database table creation if they don't exist
# In production, Alembic migrations should be used instead
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade API for Inventory & Order Management built on FastAPI and PostgreSQL.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production systems
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Middleware for Logging & Monitoring Metrics
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


# Global handler for custom exceptions violating business logic
@app.exception_handler(BusinessRuleException)
async def custom_business_rule_exception_handler(request: Request, exc: BusinessRuleException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_code": exc.__class__.__name__,
            "message": exc.detail,
            "timestamp": time.time()
        }
    )


# Health Check
@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }


# Include Routers
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)`
  },
  {
    name: "docker-compose.yml",
    path: "docker-compose.yml",
    language: "yaml",
    description: "Docker Compose orchestration for local development pairing the FastAPI backend service and PostgreSQL.",
    content: `version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: inventory_db_container
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: production_secure_pwd_here
      POSTGRES_DB: inventory_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: inventory_api_service
    restart: always
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - .:/code
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - POSTGRES_SERVER=db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=production_secure_pwd_here
      - POSTGRES_DB=inventory_db
      - POSTGRES_PORT=5432

volumes:
  postgres_data:`
  },
  {
    name: "Dockerfile",
    path: "Dockerfile",
    language: "dockerfile",
    description: "Multistage lean production Docker building blocks for Python environments.",
    content: `# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final production stage
FROM python:3.11-slim as runner

WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpq5 \\
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
COPY . /code

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
  }
];

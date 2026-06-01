from decimal import Decimal
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
    stmt = (
        select(models.Order)
        .order_by(models.Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = db.execute(stmt).scalars().unique().all()
    return result

def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    return OrderService.create_order(db, order_in)


def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)

    # Lock + restore stock
    for item in db_order.items:
        stmt = (
            select(models.Product)
            .where(models.Product.id == item.product_id)
            .with_for_update()
        )
        product = db.scalars(stmt).first()
        if product:
            product.quantity_in_stock += item.quantity

    db.delete(db_order)
    db.commit()

    # return safe response instead of ORM object
    return {
        "message": "Order deleted successfully",
        "order_id": order_id
    }

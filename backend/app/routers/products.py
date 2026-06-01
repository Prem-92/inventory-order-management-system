from fastapi import APIRouter, Depends, status
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
    return crud.delete_product(db, product_id=product_id)

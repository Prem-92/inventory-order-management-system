from fastapi import APIRouter, Depends, status
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
    return crud.delete_customer(db, customer_id=customer_id)

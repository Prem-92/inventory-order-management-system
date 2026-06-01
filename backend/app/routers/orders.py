from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from fastapi import Depends, HTTPException
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




@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    try:
        return crud.delete_order(db, order_id=order_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

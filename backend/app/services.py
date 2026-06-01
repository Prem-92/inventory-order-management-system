import logging
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

        # Start/Use safe manual transaction controls
        # (Allows nested savepoints if active transaction exists, or standard db session transaction block)
        try:
            # 1. Check customer exists
            customer = db.get(models.Customer, order_in.customer_id)
            if not customer:
                raise exceptions.ResourceNotFoundException("Customer", order_in.customer_id)

            if not order_in.items:
                raise exceptions.EmptyOrderException()

            # Ensure no duplicate product_ids in the input items array
            # By standardizing quantities, we prevent double-charging or bypasses
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
            # Concurrency Control: Select with row-level locks
            product_ids = list(consolidated_items.keys())
            stmt = select(models.Product).where(models.Product.id.in_(product_ids)).with_for_update()
            products_by_id = {p.id: p for p in db.scalars(stmt).all()}

            # Validate all requested products are present in database
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
            db.flush()  # Yields generated ID for relational mapping of items

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

            # Commit the session cleanly
            db.commit()
            db.refresh(db_order)
            logger.info(f"Successfully processed Order ID {db_order.id} for Customer {customer.full_name}")
            return db_order

        except Exception as e:
            # Automatic recovery: Rollback the outer context block safely
            db.rollback()
            logger.error(f"Transaction aborted. Rolled back order changes. Error: {str(e)}")
            raise e

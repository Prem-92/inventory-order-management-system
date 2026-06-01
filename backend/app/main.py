from fastapi import FastAPI, Request
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
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }


# Include Routers
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)

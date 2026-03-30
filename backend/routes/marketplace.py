"""
Marketplace Routes
Purpose: API endpoints for product stores, orders, and payment processing
"""

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from database import get_db
from schemas.marketplace import (
    StoreCreate, StoreResponse,
    ProductCreate, ProductResponse,
    OrderCreate, OrderResponse,
    AddressCreate, AddressResponse,
    OrderStatusUpdate
)
from services.marketplace_service import MarketplaceService
from utils.security import JWTManager

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> int:
    """
    Dependency to get current authenticated user from JWT token
    Returns: user_id
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    user_id = JWTManager.get_user_id_from_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user_id


# ========================
# STORE ENDPOINTS
# ========================

@router.post("/stores", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store: StoreCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Create a new store for authenticated user"""
    try:
        result = MarketplaceService.create_store(
            db,
            owner_id=current_user,
            name=store.name,
            description=store.description
        )
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store creation failed"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Store creation failed: {str(e)}"
        )


@router.get("/stores", response_model=List[StoreResponse])
async def list_my_stores(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Get all stores owned by current user"""
    try:
        stores = MarketplaceService.get_user_stores(db, current_user)
        return stores
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve stores: {str(e)}"
        )


@router.get("/stores/{store_id}", response_model=StoreResponse)
async def get_store(
    store_id: int,
    db: Session = Depends(get_db)
):
    """Get store details by ID"""
    try:
        store = db.execute(
            text("SELECT id, owner_id, name, description, is_active, created_at, updated_at FROM stores WHERE id = :id"),
            {"id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        return dict(store._mapping)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve store: {str(e)}"
        )


@router.put("/stores/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: int,
    store_update: StoreCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Update store details (owner only)"""
    try:
        # Verify ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own stores"
            )
        
        result = MarketplaceService.update_store(
            db,
            store_id,
            {
                "name": store_update.name,
                "description": store_update.description
            }
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Store update failed: {str(e)}"
        )


@router.delete("/stores/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Delete a store (owner only)"""
    try:
        # Verify ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own stores"
            )
        
        MarketplaceService.delete_store(db, store_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Store deletion failed: {str(e)}"
        )


# ========================
# PRODUCT ENDPOINTS
# ========================

@router.post("/stores/{store_id}/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    store_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Create a new product in a store"""
    try:
        # Verify store ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only add products to your own stores"
            )
        
        result = MarketplaceService.create_product(
            db,
            store_id=store_id,
            product_data={
                "title": product.title,
                "description": product.description,
                "price": product.price,
                "stock": product.stock,
                "media_ids": product.media_ids or []
            }
        )
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product creation failed"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product creation failed: {str(e)}"
        )


@router.get("/stores/{store_id}/products", response_model=List[ProductResponse])
async def list_store_products(
    store_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List all products in a store"""
    try:
        if limit > 100:
            limit = 100
        
        products = MarketplaceService.list_products(db, store_id=store_id, skip=skip, limit=limit)
        return products
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list products: {str(e)}"
        )


@router.get("/products", response_model=List[ProductResponse])
async def list_all_products(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List all products in marketplace (all stores)"""
    try:
        if limit > 100:
            limit = 100
        
        products = MarketplaceService.list_products(db, store_id=None, skip=skip, limit=limit)
        return products
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list products: {str(e)}"
        )


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get product details"""
    try:
        product = MarketplaceService.get_product_by_id(db, product_id)
        
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product: {str(e)}"
        )


@router.put("/stores/{store_id}/products/{product_id}", response_model=ProductResponse)
async def update_product(
    store_id: int,
    product_id: int,
    product_update: ProductCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Update product details (owner only)"""
    try:
        # Verify store ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update products in your own stores"
            )
        
        # Verify product belongs to store
        product = db.execute(
            text("SELECT store_id FROM products WHERE id = :product_id"),
            {"product_id": product_id}
        ).fetchone()
        
        if product is None or product[0] != store_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this store"
            )
        
        result = MarketplaceService.update_product(
            db,
            product_id,
            {
                "title": product_update.title,
                "description": product_update.description,
                "price": product_update.price,
                "stock": product_update.stock
            }
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product update failed: {str(e)}"
        )


@router.delete("/stores/{store_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    store_id: int,
    product_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Delete a product (soft delete)"""
    try:
        # Verify store ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete products from your own stores"
            )
        
        # Verify product belongs to store
        product = db.execute(
            text("SELECT store_id FROM products WHERE id = :product_id"),
            {"product_id": product_id}
        ).fetchone()
        
        if product is None or product[0] != store_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this store"
            )
        
        MarketplaceService.delete_product(db, product_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product deletion failed: {str(e)}"
        )


# ========================
# STORE ORDER ENDPOINTS (Buyer - Place order at specific store)
# ========================

@router.post("/stores/{store_id}/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_store_order(
    store_id: int,
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Create a new order in a specific store"""
    try:
        # Verify store exists
        store = db.execute(
            text("SELECT id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        # Validate all products belong to this store and have stock
        for item in order.items:
            product = db.execute(
                text("SELECT id, store_id, title, stock FROM products WHERE id = :product_id AND is_active = TRUE"),
                {"product_id": item.product_id}
            ).fetchone()
            
            if product is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product {item.product_id} not found"
                )
            
            if product[1] != store_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {product[2]} is not in this store"
                )
            
            if product[3] < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product {product[2]}"
                )
        
        result = MarketplaceService.create_order(
            db,
            buyer_id=current_user,
            order_data={
                "items": [{"product_id": item.product_id, "quantity": item.quantity} for item in order.items],
                "address": order.address,
                "city": order.city,
                "phone": order.phone,
                "payment_method": order.payment_method.value  # Get enum value as string
            }
        )
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order creation failed"
            )
        
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation failed: {str(e)}"
        )


@router.get("/stores/{store_id}/orders", response_model=List[OrderResponse])
async def list_store_orders(
    store_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Get all orders placed in a store (seller view)"""
    try:
        # Verify store ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view orders for your own stores"
            )
        
        if limit > 100:
            limit = 100
        
        orders = MarketplaceService.get_store_orders(db, store_id, skip=skip, limit=limit)
        return orders
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list store orders: {str(e)}"
        )


@router.get("/stores/{store_id}/orders/{order_id}", response_model=dict)
async def get_store_order(
    store_id: int,
    order_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Get specific order details in a store"""
    try:
        # Verify store exists and ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view orders for your own stores"
            )
        
        # Verify order belongs to this store
        order = MarketplaceService.get_order_by_id(db, order_id)
        
        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check if order has items from this store
        order_items = db.execute(
            text("""
                SELECT COUNT(*)
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = :order_id AND p.store_id = :store_id
            """),
            {"order_id": order_id, "store_id": store_id}
        ).fetchone()
        
        if order_items[0] == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found in this store"
            )
        
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve order: {str(e)}"
        )


@router.patch("/stores/{store_id}/orders/{order_id}/status")
async def update_store_order_status(
    store_id: int,
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Update order status in a store (seller only)"""
    try:
        new_status = status_update.status.value
        
        # Verify store ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update orders for your own stores"
            )
        
        # Verify seller has products in this order
        order_items = db.execute(
            text("""
                SELECT COUNT(*)
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = :order_id AND p.store_id = :store_id
            """),
            {"order_id": order_id, "store_id": store_id}
        ).fetchone()
        
        if order_items[0] == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This order does not belong to your store"
            )
        
        result = MarketplaceService.update_order_status(db, order_id, new_status)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status update failed: {str(e)}"
        )


@router.post("/stores/{store_id}/orders/{order_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_store_order(
    store_id: int,
    order_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Cancel an order in a store (buyer only)"""
    try:
        # Verify store exists
        store = db.execute(
            text("SELECT id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        # Get order details
        order = db.execute(
            text("SELECT buyer_id, status FROM orders WHERE id = :order_id"),
            {"order_id": order_id}
        ).fetchone()
        
        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own orders"
            )
        
        if order[1] in ['DELIVERED', 'REFUNDED', 'CANCELLED']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel order with status {order[1]}"
            )
        
        # Verify order has items from this store
        order_items = db.execute(
            text("""
                SELECT COUNT(*)
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = :order_id AND p.store_id = :store_id
            """),
            {"order_id": order_id, "store_id": store_id}
        ).fetchone()
        
        if order_items[0] == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found in this store"
            )
        
        MarketplaceService.cancel_order(db, order_id)
        
        return {"message": "Order cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order cancellation failed: {str(e)}"
        )


# ========================
# STORE STATS
# ========================

@router.get("/stores/{store_id}/stats")
async def get_store_stats(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Get store statistics"""
    try:
        # Verify store ownership
        store = db.execute(
            text("SELECT owner_id FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        ).fetchone()
        
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        if store[0] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view stats for your own stores"
            )
        
        stats = MarketplaceService.get_store_stats(db, store_id)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get store stats: {str(e)}"
        )



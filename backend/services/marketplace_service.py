"""
Marketplace Service
Purpose: Business logic for product stores, orders, and payment processing
"""

from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any, Optional


class MarketplaceService:
    """Service for marketplace and e-commerce operations"""
    
    @staticmethod
    def create_store(db: Session, owner_id: int, name: str, description: str = None) -> Dict[str, Any]:
        """Create a new store for a user (users can create multiple stores)"""
        db.execute(
            text("""
                INSERT INTO stores (owner_id, name, description, is_active, created_at, updated_at)
                VALUES (:owner_id, :name, :description, TRUE, NOW(), NOW())
            """),
            {
                "owner_id": owner_id,
                "name": name,
                "description": description or ""
            }
        )
        db.commit()
        
        # Get last insert ID using MySQL function
        store_id_result = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
        store_id = store_id_result[0] if store_id_result else None
        
        if not store_id:
            return None
        
        # Fetch and return the created store
        store = db.execute(
            text("SELECT id, owner_id, name, description, is_active, created_at, updated_at FROM stores WHERE id = :id"),
            {"id": store_id}
        ).fetchone()
        
        return dict(store._mapping) if store else None
    
    @staticmethod
    def get_user_store(db: Session, user_id: int) -> Dict[str, Any]:
        """Get user's first store (deprecated - use get_user_stores for multiple)"""
        store = db.execute(
            text("""
                SELECT id, owner_id, name, description, is_active, created_at, updated_at 
                FROM stores 
                WHERE owner_id = :owner_id
                LIMIT 1
            """),
            {"owner_id": user_id}
        ).fetchone()
        
        return dict(store._mapping) if store else None
    
    @staticmethod
    def get_user_stores(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Get all stores owned by a user"""
        stores = db.execute(
            text("""
                SELECT id, owner_id, name, description, is_active, created_at, updated_at 
                FROM stores 
                WHERE owner_id = :owner_id
                ORDER BY created_at DESC
            """),
            {"owner_id": user_id}
        ).fetchall()
        
        return [dict(store._mapping) if store else {} for store in stores]
    
    @staticmethod
    def update_store(db: Session, store_id: int, store_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update store details"""
        db.execute(
            text("""
                UPDATE stores
                SET name = :name,
                    description = :description,
                    updated_at = NOW()
                WHERE id = :store_id
            """),
            {
                "store_id": store_id,
                "name": store_data.get("name"),
                "description": store_data.get("description", "")
            }
        )
        db.commit()
        
        # Fetch and return updated store
        store = db.execute(
            text("SELECT id, owner_id, name, description, is_active, created_at, updated_at FROM stores WHERE id = :id"),
            {"id": store_id}
        ).fetchone()
        
        return dict(store._mapping) if store else None
    
    @staticmethod
    def delete_store(db: Session, store_id: int) -> bool:
        """Delete a store"""
        db.execute(
            text("DELETE FROM stores WHERE id = :store_id"),
            {"store_id": store_id}
        )
        db.commit()
        return True
    
    @staticmethod
    def create_product(db: Session, store_id: int, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new product in a store"""
        db.execute(
            text("""
                INSERT INTO products (store_id, title, description, price, stock, is_active, created_at, updated_at)
                VALUES (:store_id, :title, :description, :price, :stock, TRUE, NOW(), NOW())
            """),
            {
                "store_id": store_id,
                "title": product_data["title"],
                "description": product_data.get("description", ""),
                "price": product_data["price"],
                "stock": product_data["stock"]
            }
        )
        db.commit()
        
        # Get last insert ID
        product_id_result = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
        product_id = product_id_result[0] if product_id_result else None
        
        if not product_id:
            return None
        
        # Add media associations if provided
        if product_data.get("media_ids"):
            for media_id in product_data["media_ids"]:
                # Skip invalid media IDs (0 or negative)
                if not media_id or media_id <= 0:
                    continue
                
                # Verify media exists before creating association
                media_exists = db.execute(
                    text("SELECT id FROM media WHERE id = :media_id"),
                    {"media_id": media_id}
                ).fetchone()
                
                if not media_exists:
                    continue
                
                db.execute(
                    text("""
                        INSERT INTO product_media (product_id, media_id)
                        VALUES (:product_id, :media_id)
                    """),
                    {"product_id": product_id, "media_id": media_id}
                )
            db.commit()
        
        # Fetch and return the created product
        product = db.execute(
            text("""
                SELECT id, store_id, title, description, price, stock, is_active, created_at, updated_at
                FROM products
                WHERE id = :id
            """),
            {"id": product_id}
        ).fetchone()
        
        return dict(product._mapping) if product else None
    
    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Dict[str, Any]:
        """Get product by ID"""
        product = db.execute(
            text("""
                SELECT id, store_id, title, description, price, stock, is_active, created_at, updated_at
                FROM products
                WHERE id = :product_id AND is_active = TRUE AND deleted_at IS NULL
            """),
            {"product_id": product_id}
        ).fetchone()
        
        return dict(product._mapping) if product else None
    
    @staticmethod
    def list_products(db: Session, store_id: int = None, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """List products with optional store filter"""
        if store_id:
            products = db.execute(
                text("""
                    SELECT id, store_id, title, description, price, stock, is_active, created_at, updated_at
                    FROM products
                    WHERE store_id = :store_id AND is_active = TRUE AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"store_id": store_id, "skip": skip, "limit": limit}
            ).fetchall()
        else:
            products = db.execute(
                text("""
                    SELECT id, store_id, title, description, price, stock, is_active, created_at, updated_at
                    FROM products
                    WHERE is_active = TRUE AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"skip": skip, "limit": limit}
            ).fetchall()
        
        return [dict(product._mapping) for product in products]
    
    @staticmethod
    def update_product(db: Session, product_id: int, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update product details"""
        db.execute(
            text("""
                UPDATE products
                SET title = :title,
                    description = :description,
                    price = :price,
                    stock = :stock,
                    updated_at = NOW()
                WHERE id = :product_id
            """),
            {
                "product_id": product_id,
                "title": product_data.get("title"),
                "description": product_data.get("description"),
                "price": product_data.get("price"),
                "stock": product_data.get("stock")
            }
        )
        db.commit()
        
        # Fetch and return updated product
        product = db.execute(
            text("""
                SELECT id, store_id, title, description, price, stock, is_active, created_at, updated_at
                FROM products
                WHERE id = :product_id
            """),
            {"product_id": product_id}
        ).fetchone()
        
        return dict(product._mapping) if product else None
    
    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        """Soft delete a product"""
        db.execute(
            text("""
                UPDATE products
                SET deleted_at = NOW(), is_active = FALSE, updated_at = NOW()
                WHERE id = :product_id
            """),
            {"product_id": product_id}
        )
        db.commit()
        return True
    
    @staticmethod
    def create_order(db: Session, buyer_id: int, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order with items, address, and payment"""
        items = order_data.get("items", [])
        
        # Validate payment method
        valid_payment_methods = ['COD', 'CARD', 'EASYPaisa', 'JAZZCASH']
        payment_method = order_data.get("payment_method")
        if payment_method not in valid_payment_methods:
            raise ValueError(f"Invalid payment method: {payment_method}. Must be one of {valid_payment_methods}")
        
        # Calculate total amount
        total_amount = 0
        for item in items:
            product = db.execute(
                text("SELECT price FROM products WHERE id = :product_id AND is_active = TRUE"),
                {"product_id": item["product_id"]}
            ).fetchone()
            
            if not product:
                return None
            
            total_amount += float(product[0]) * item["quantity"]
        
        # Create order
        order_result = db.execute(
            text("""
                INSERT INTO orders (buyer_id, status, total_amount, created_at, updated_at)
                VALUES (:buyer_id, 'PENDING', :total_amount, NOW(), NOW())
            """),
            {
                "buyer_id": buyer_id,
                "total_amount": total_amount
            }
        )
        db.commit()
        
        order_id = order_result.lastrowid
        
        # Add order items
        for item in items:
            product = db.execute(
                text("SELECT price FROM products WHERE id = :product_id"),
                {"product_id": item["product_id"]}
            ).fetchone()
            
            db.execute(
                text("""
                    INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
                    VALUES (:order_id, :product_id, :quantity, :price)
                """),
                {
                    "order_id": order_id,
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "price": product[0]
                }
            )
            
            # Update product stock
            db.execute(
                text("""
                    UPDATE products
                    SET stock = stock - :quantity, updated_at = NOW()
                    WHERE id = :product_id
                """),
                {
                    "product_id": item["product_id"],
                    "quantity": item["quantity"]
                }
            )
        
        db.commit()
        
        # Add shipping address
        db.execute(
            text("""
                INSERT INTO order_addresses (order_id, address, city, phone)
                VALUES (:order_id, :address, :city, :phone)
            """),
            {
                "order_id": order_id,
                "address": order_data["address"],
                "city": order_data["city"],
                "phone": order_data["phone"]
            }
        )
        
        # Create payment record
        db.execute(
            text("""
                INSERT INTO payments (order_id, method, status, created_at, updated_at)
                VALUES (:order_id, :method, 'PENDING', NOW(), NOW())
            """),
            {
                "order_id": order_id,
                "method": order_data["payment_method"]
            }
        )
        
        db.commit()
        
        # Fetch and return the created order
        order = db.execute(
            text("""
                SELECT id, buyer_id, status, total_amount, created_at, updated_at
                FROM orders
                WHERE id = :order_id
            """),
            {"order_id": order_id}
        ).fetchone()
        
        return dict(order._mapping) if order else None
    
    @staticmethod
    def get_order_by_id(db: Session, order_id: int) -> Dict[str, Any]:
        """Get order by ID with items and address"""
        order = db.execute(
            text("""
                SELECT id, buyer_id, status, total_amount, created_at, updated_at
                FROM orders
                WHERE id = :order_id
            """),
            {"order_id": order_id}
        ).fetchone()
        
        if not order:
            return None
        
        order_dict = dict(order._mapping)
        
        # Get order items
        items = db.execute(
            text("""
                SELECT oi.id, oi.product_id, p.title, oi.quantity, oi.price_at_time,
                       p.description, p.price
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = :order_id
            """),
            {"order_id": order_id}
        ).fetchall()
        
        order_dict["items"] = [dict(item._mapping) for item in items]
        
        # Get address
        address = db.execute(
            text("""
                SELECT id, address, city, phone
                FROM order_addresses
                WHERE order_id = :order_id
            """),
            {"order_id": order_id}
        ).fetchone()
        
        if address:
            order_dict["address"] = dict(address._mapping)
        
        # Get payment info
        payment = db.execute(
            text("""
                SELECT id, method, status, transaction_ref, refund_amount, refund_status
                FROM payments
                WHERE order_id = :order_id
            """),
            {"order_id": order_id}
        ).fetchone()
        
        if payment:
            order_dict["payment"] = dict(payment._mapping)
        
        return order_dict
    
    @staticmethod
    def get_user_orders(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's orders (as a buyer)"""
        orders = db.execute(
            text("""
                SELECT id, buyer_id, status, total_amount, created_at, updated_at
                FROM orders
                WHERE buyer_id = :buyer_id
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :skip
            """),
            {"buyer_id": user_id, "skip": skip, "limit": limit}
        ).fetchall()
        
        return [dict(order._mapping) for order in orders]
    
    @staticmethod
    def get_store_orders(db: Session, store_id: int, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """Get orders placed with a store (seller view)"""
        orders = db.execute(
            text("""
                SELECT DISTINCT o.id, o.buyer_id, o.status, o.total_amount, o.created_at, o.updated_at
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE p.store_id = :store_id
                ORDER BY o.created_at DESC
                LIMIT :limit OFFSET :skip
            """),
            {"store_id": store_id, "skip": skip, "limit": limit}
        ).fetchall()
        
        return [dict(order._mapping) for order in orders]
    
    @staticmethod
    def cancel_order(db: Session, order_id: int) -> bool:
        """Cancel an order and refund stock"""
        # Get order items to restore stock
        items = db.execute(
            text("""
                SELECT product_id, quantity
                FROM order_items
                WHERE order_id = :order_id
            """),
            {"order_id": order_id}
        ).fetchall()
        
        # Restore stock for each item
        for item in items:
            db.execute(
                text("""
                    UPDATE products
                    SET stock = stock + :quantity, updated_at = NOW()
                    WHERE id = :product_id
                """),
                {
                    "product_id": item[0],
                    "quantity": item[1]
                }
            )
        
        # Update order status
        db.execute(
            text("""
                UPDATE orders
                SET status = 'CANCELLED', updated_at = NOW()
                WHERE id = :order_id
            """),
            {"order_id": order_id}
        )
        
        # Update payment status
        db.execute(
            text("""
                UPDATE payments
                SET status = 'REFUNDED', refund_status = 'PENDING', updated_at = NOW()
                WHERE order_id = :order_id
            """),
            {"order_id": order_id}
        )
        
        db.commit()
        return True
    
    @staticmethod
    def update_order_status(db: Session, order_id: int, status: str) -> Dict[str, Any]:
        """Update order status by seller"""
        valid_statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
        
        if status.upper() not in valid_statuses:
            return None
        
        db.execute(
            text("""
                UPDATE orders
                SET status = :status, updated_at = NOW()
                WHERE id = :order_id
            """),
            {"order_id": order_id, "status": status.upper()}
        )
        db.commit()
        
        # Fetch and return updated order
        order = db.execute(
            text("""
                SELECT id, buyer_id, status, total_amount, created_at, updated_at
                FROM orders
                WHERE id = :order_id
            """),
            {"order_id": order_id}
        ).fetchone()
        
        return dict(order._mapping) if order else None
    
    @staticmethod
    def get_store_stats(db: Session, store_id: int) -> Dict[str, Any]:
        """Get store statistics"""
        # Total products
        products = db.execute(
            text("SELECT COUNT(*) FROM products WHERE store_id = :store_id AND is_active = TRUE"),
            {"store_id": store_id}
        ).fetchone()[0]
        
        # Total revenue
        revenue = db.execute(
            text("""
                SELECT COALESCE(SUM(o.total_amount), 0)
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE p.store_id = :store_id AND o.status IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')
            """),
            {"store_id": store_id}
        ).fetchone()[0]
        
        # Total orders
        orders = db.execute(
            text("""
                SELECT COUNT(DISTINCT o.id)
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE p.store_id = :store_id
            """),
            {"store_id": store_id}
        ).fetchone()[0]
        
        return {
            "total_products": products,
            "total_revenue": float(revenue) if revenue else 0,
            "total_orders": orders
        }

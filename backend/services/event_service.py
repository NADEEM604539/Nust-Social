"""
Event Service
Purpose: Business logic for event management, ticket creation, and ticket purchase handling
Uses raw MySQL queries with SQLAlchemy's text() for direct SQL execution
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from datetime import datetime


class EventService:
    """Service for event-related operations"""
    
    @staticmethod
    def create_event(db: Session, society_id: int, user_id: int, event_data) -> dict:
        """Create a new event (admin only)"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            # Check if user is admin of society
            is_admin = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id AND role = 'ADMIN'
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins can create events"
                )
            
            # Validate event date is in future
            if event_data.event_date <= datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Event date must be in the future"
                )
            
            # Create event
            db.execute(
                text("""
                    INSERT INTO events (society_id, title, description, location, event_date, created_at)
                    VALUES (:society_id, :title, :description, :location, :event_date, NOW())
                """),
                {
                    "society_id": society_id,
                    "title": event_data.title,
                    "description": event_data.description,
                    "location": event_data.location,
                    "event_date": event_data.event_date
                }
            )
            db.flush()
            
            # Get event ID
            event_result = db.execute(
                text("""
                    SELECT id FROM events 
                    WHERE society_id = :society_id AND title = :title
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"society_id": society_id, "title": event_data.title}
            ).fetchone()
            
            event_id = event_result[0]
            db.commit()
            
            return {
                "id": event_id,
                "society_id": society_id,
                "title": event_data.title,
                "description": event_data.description,
                "location": event_data.location,
                "event_date": event_data.event_date
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create event: {str(e)}"
            )
    
    @staticmethod
    def get_event_by_id(db: Session, event_id: int) -> dict:
        """Get event by ID"""
        try:
            event = db.execute(
                text("""
                    SELECT id, society_id, title, description, location, event_date, created_at 
                    FROM events WHERE id = :id
                """),
                {"id": event_id}
            ).fetchone()
            
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            return {
                "id": event[0],
                "society_id": event[1],
                "title": event[2],
                "description": event[3],
                "location": event[4],
                "event_date": event[5],
                "created_at": event[6]
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get event: {str(e)}"
            )
    
    @staticmethod
    def list_events(db: Session, skip: int = 0, limit: int = 20, upcoming_only: bool = True) -> list:
        """List events with optional filtering by upcoming"""
        try:
            if upcoming_only:
                events = db.execute(
                    text("""
                        SELECT id, society_id, title, description, location, event_date, created_at 
                        FROM events 
                        WHERE event_date > NOW()
                        ORDER BY event_date ASC
                        LIMIT :limit OFFSET :skip
                    """),
                    {"limit": limit, "skip": skip}
                ).fetchall()
            else:
                events = db.execute(
                    text("""
                        SELECT id, society_id, title, description, location, event_date, created_at 
                        FROM events 
                        ORDER BY event_date ASC
                        LIMIT :limit OFFSET :skip
                    """),
                    {"limit": limit, "skip": skip}
                ).fetchall()
            
            return [
                {
                    "id": e[0],
                    "society_id": e[1],
                    "title": e[2],
                    "description": e[3],
                    "location": e[4],
                    "event_date": e[5],
                    "created_at": e[6]
                }
                for e in events
            ]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list events: {str(e)}"
            )
    
    @staticmethod
    def list_society_events(db: Session, society_id: int, skip: int = 0, limit: int = 20) -> list:
        """List events for a society"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            events = db.execute(
                text("""
                    SELECT id, society_id, title, description, location, event_date, created_at 
                    FROM events 
                    WHERE society_id = :society_id
                    ORDER BY event_date ASC
                    LIMIT :limit OFFSET :skip
                """),
                {"society_id": society_id, "limit": limit, "skip": skip}
            ).fetchall()
            
            return [
                {
                    "id": e[0],
                    "society_id": e[1],
                    "title": e[2],
                    "description": e[3],
                    "location": e[4],
                    "event_date": e[5],
                    "created_at": e[6]
                }
                for e in events
            ]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list society events: {str(e)}"
            )
    
    @staticmethod
    def update_event(db: Session, event_id: int, user_id: int, event_data) -> dict:
        """Update event details (admin only)"""
        try:
            event = EventService.get_event_by_id(db, event_id)
            society_id = event["society_id"]
            
            # Check if user is admin of society
            is_admin = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id AND role = 'ADMIN'
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins can update events"
                )
            
            # Validate new event date if provided
            if event_data.event_date and event_data.event_date <= datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Event date must be in the future"
                )
            
            # Build update query dynamically
            update_fields = []
            params = {"id": event_id}
            
            if event_data.title is not None:
                update_fields.append("title = :title")
                params["title"] = event_data.title
            
            if event_data.description is not None:
                update_fields.append("description = :description")
                params["description"] = event_data.description
            
            if event_data.location is not None:
                update_fields.append("location = :location")
                params["location"] = event_data.location
            
            if event_data.event_date is not None:
                update_fields.append("event_date = :event_date")
                params["event_date"] = event_data.event_date
            
            if update_fields:
                update_fields.append("updated_at = NOW()")
                query = f"UPDATE events SET {', '.join(update_fields)} WHERE id = :id"
                db.execute(text(query), params)
                db.commit()
            
            return EventService.get_event_by_id(db, event_id)
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update event: {str(e)}"
            )
    
    @staticmethod
    def delete_event(db: Session, event_id: int, user_id: int) -> bool:
        """Delete an event (admin only)"""
        try:
            event = EventService.get_event_by_id(db, event_id)
            society_id = event["society_id"]
            
            # Check if user is admin of society
            is_admin = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id AND role = 'ADMIN'
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins can delete events"
                )
            
            db.execute(
                text("DELETE FROM events WHERE id = :id"),
                {"id": event_id}
            )
            db.commit()
            return True
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete event: {str(e)}"
            )
    
    # ==================== TICKET MANAGEMENT ====================
    
    @staticmethod
    def create_ticket(db: Session, event_id: int, user_id: int, ticket_type: str, price: float, total_stock: int) -> dict:
        """Create a ticket type for an event (admin only)"""
        try:
            event = EventService.get_event_by_id(db, event_id)
            society_id = event["society_id"]
            
            # Check if user is admin of society
            is_admin = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id AND role = 'ADMIN'
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins can create tickets"
                )
            
            # Validate ticket type
            valid_types = ["VIP", "REGULAR", "STUDENT", "FREE"]
            if ticket_type not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ticket type. Must be VIP, REGULAR, STUDENT, or FREE"
                )
            
            # Validate price and stock
            if price < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ticket price cannot be negative"
                )
            
            if total_stock <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Total stock must be greater than 0"
                )
            
            # Check if ticket type already exists
            existing = db.execute(
                text("""
                    SELECT id FROM event_tickets 
                    WHERE event_id = :event_id AND type = :type
                """),
                {"event_id": event_id, "type": ticket_type}
            ).fetchone()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"{ticket_type} tickets already exist for this event"
                )
            
            # Create ticket
            db.execute(
                text("""
                    INSERT INTO event_tickets (event_id, type, price, total_stock, sold_count, created_at)
                    VALUES (:event_id, :type, :price, :total_stock, 0, NOW())
                """),
                {
                    "event_id": event_id,
                    "type": ticket_type,
                    "price": price,
                    "total_stock": total_stock
                }
            )
            db.flush()
            
            # Get ticket ID
            ticket_result = db.execute(
                text("""
                    SELECT id FROM event_tickets 
                    WHERE event_id = :event_id AND type = :type
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"event_id": event_id, "type": ticket_type}
            ).fetchone()
            
            ticket_id = ticket_result[0]
            db.commit()
            
            return {
                "id": ticket_id,
                "event_id": event_id,
                "type": ticket_type,
                "price": price,
                "total_stock": total_stock,
                "sold_count": 0
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create ticket: {str(e)}"
            )
    
    @staticmethod
    def list_event_tickets(db: Session, event_id: int) -> list:
        """Get all ticket types for an event"""
        try:
            # Verify event exists
            event_check = db.execute(
                text("SELECT id FROM events WHERE id = :id"),
                {"id": event_id}
            ).fetchone()
            
            if not event_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            tickets = db.execute(
                text("""
                    SELECT id, event_id, type, price, total_stock, sold_count, created_at
                    FROM event_tickets
                    WHERE event_id = :event_id
                    ORDER BY created_at ASC
                """),
                {"event_id": event_id}
            ).fetchall()
            
            return [
                {
                    "id": t[0],
                    "event_id": t[1],
                    "type": t[2],
                    "price": t[3],
                    "total_stock": t[4],
                    "sold_count": t[5],
                    "available": t[4] - t[5],
                    "created_at": t[6]
                }
                for t in tickets
            ]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list tickets: {str(e)}"
            )
    
    @staticmethod
    def purchase_ticket(db: Session, ticket_id: int, user_id: int, quantity: int = 1) -> dict:
        """Purchase tickets"""
        try:
            # Get ticket
            ticket = db.execute(
                text("""
                    SELECT id, event_id, type, price, total_stock, sold_count 
                    FROM event_tickets 
                    WHERE id = :id
                """),
                {"id": ticket_id}
            ).fetchone()
            
            if not ticket:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ticket type not found"
                )
            
            event_id = ticket[1]
            available = ticket[4] - ticket[5]
            
            # Validate quantity
            if quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quantity must be greater than 0"
                )
            
            if quantity > available:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Only {available} tickets available"
                )
            
            # Create purchase record
            total_price = ticket[3] * quantity
            db.execute(
                text("""
                    INSERT INTO event_ticket_purchases (ticket_id, user_id, quantity, total_price, purchase_date)
                    VALUES (:ticket_id, :user_id, :quantity, :total_price, NOW())
                """),
                {
                    "ticket_id": ticket_id,
                    "user_id": user_id,
                    "quantity": quantity,
                    "total_price": total_price
                }
            )
            
            # Update sold count
            db.execute(
                text("""
                    UPDATE event_tickets 
                    SET sold_count = sold_count + :quantity 
                    WHERE id = :id
                """),
                {"quantity": quantity, "id": ticket_id}
            )
            db.commit()
            
            return {
                "event_id": event_id,
                "ticket_id": ticket_id,
                "quantity": quantity,
                "total_price": total_price,
                "purchase_date": datetime.utcnow()
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to purchase tickets: {str(e)}"
            )
    
    @staticmethod
    def get_user_purchases(db: Session, user_id: int) -> list:
        """Get all ticket purchases by a user"""
        try:
            purchases = db.execute(
                text("""
                    SELECT et.event_id, et.type, etp.quantity, etp.total_price, etp.purchase_date
                    FROM event_ticket_purchases etp
                    JOIN event_tickets et ON etp.ticket_id = et.id
                    WHERE etp.user_id = :user_id
                    ORDER BY etp.purchase_date DESC
                """),
                {"user_id": user_id}
            ).fetchall()
            
            return [
                {
                    "event_id": p[0],
                    "ticket_type": p[1],
                    "quantity": p[2],
                    "total_price": p[3],
                    "purchase_date": p[4]
                }
                for p in purchases
            ]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get purchases: {str(e)}"
            )

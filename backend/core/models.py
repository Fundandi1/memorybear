from django.db import models
import uuid

# Order status choices
STATUS_CHOICES = [
    ('CREATED', 'Created'),
    ('PROCESSING', 'Processing'),
    ('SESSION_COMPLETED', 'Session Completed'),
    ('SESSION_FAILED', 'Session Failed'),
    ('SESSION_CANCELLED', 'Session Cancelled'),
    ('PAYMENT_CONFIRMED', 'Payment Confirmed'),
    ('PAYMENT_FAILED', 'Payment Failed'),
    ('SHIPPED', 'Shipped'),
    ('COMPLETED', 'Completed'),
    ('REFUNDED', 'Refunded'),
]

class Customer(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=10)
    city = models.CharField(max_length=100)
    marketing_consent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"

class Order(models.Model):
    # Basic order information
    reference = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True)
    callback_token = models.CharField(max_length=100)
    
    # Payment details
    amount = models.IntegerField(help_text="Amount in øre (cents)")
    currency = models.CharField(max_length=3, default="DKK")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="CREATED")
    
    # Shipping information
    shipping_method = models.CharField(max_length=20, default="home", choices=[
        ('home', 'Home Delivery'),
        ('pickup', 'Pickup Point'),
    ])
    shipping_cost = models.IntegerField(default=4900)  # in øre (49 DKK)
    pickup_point_id = models.CharField(max_length=50, null=True, blank=True)
    
    # Payment method
    payment_method = models.CharField(max_length=20, default="mobilepay", choices=[
        ('mobilepay', 'MobilePay'),
        ('card', 'Credit Card'),
    ])
    
    # Additional information
    comments = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Order {self.reference} - {self.status}"
    
    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
    
    def save(self, *args, **kwargs):
        # Generate a reference if not provided
        if not self.reference:
            self.reference = f"order-{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    price = models.IntegerField(help_text="Price in øre (cents)")
    quantity = models.PositiveIntegerField(default=1)
    
    # Product specific fields for Mindebamsen
    fabric_type = models.CharField(max_length=100, null=True, blank=True)
    body_fabric = models.CharField(max_length=255, null=True, blank=True)
    head_fabric = models.CharField(max_length=255, null=True, blank=True)
    under_arms_fabric = models.CharField(max_length=255, null=True, blank=True)
    belly_fabric = models.CharField(max_length=255, null=True, blank=True)
    has_vest = models.BooleanField(default=False)
    vest_fabric = models.CharField(max_length=255, null=True, blank=True)
    face_style = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} in order {self.order.reference}"
    
    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

class PaymentLog(models.Model):
    order = models.ForeignKey(Order, related_name="payment_logs", on_delete=models.CASCADE)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    event_type = models.CharField(max_length=50)
    amount = models.IntegerField(null=True, blank=True, help_text="Amount in øre (cents)")
    status = models.CharField(max_length=50)
    response_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment log for {self.order.reference} - {self.event_type}"
    
    class Meta:
        verbose_name = "Payment Log"
        verbose_name_plural = "Payment Logs"
        ordering = ['-created_at']
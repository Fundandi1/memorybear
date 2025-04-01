from django.contrib import admin
from core.models import Customer, Order, OrderItem, PaymentLog

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class PaymentLogInline(admin.TabularInline):
    model = PaymentLog
    extra = 0
    readonly_fields = ['event_type', 'status', 'amount', 'transaction_id', 'created_at', 'response_data']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'phone', 'city', 'created_at']
    list_filter = ['marketing_consent', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'address', 'city']
    date_hierarchy = 'created_at'

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['reference', 'get_customer_name', 'amount_in_dkk', 'status', 'payment_method', 'shipping_method', 'created_at']
    list_filter = ['status', 'payment_method', 'shipping_method', 'created_at', 'completed_at']
    search_fields = ['reference', 'customer__first_name', 'customer__last_name', 'customer__email']
    readonly_fields = ['reference', 'callback_token', 'created_at', 'updated_at', 'completed_at']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline, PaymentLogInline]
    
    def get_customer_name(self, obj):
        if obj.customer:
            return f"{obj.customer.first_name} {obj.customer.last_name}"
        return "Guest"
    get_customer_name.short_description = "Customer"
    
    def amount_in_dkk(self, obj):
        return f"{obj.amount / 100:.2f} DKK"
    amount_in_dkk.short_description = "Amount"

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'order_reference', 'price_in_dkk', 'quantity', 'has_vest']
    list_filter = ['has_vest', 'face_style']
    search_fields = ['name', 'order__reference']
    
    def order_reference(self, obj):
        return obj.order.reference
    order_reference.short_description = "Order Reference"
    
    def price_in_dkk(self, obj):
        return f"{obj.price / 100:.2f} DKK"
    price_in_dkk.short_description = "Price"

@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ['order_reference', 'event_type', 'status', 'amount_in_dkk', 'created_at']
    list_filter = ['event_type', 'status', 'created_at']
    search_fields = ['order__reference', 'transaction_id']
    readonly_fields = ['order', 'event_type', 'status', 'amount', 'transaction_id', 'created_at', 'response_data']
    date_hierarchy = 'created_at'
    
    def order_reference(self, obj):
        return obj.order.reference
    order_reference.short_description = "Order Reference"
    
    def amount_in_dkk(self, obj):
        if obj.amount:
            return f"{obj.amount / 100:.2f} DKK"
        return "-"
    amount_in_dkk.short_description = "Amount"
    
    def has_add_permission(self, request):
        return False

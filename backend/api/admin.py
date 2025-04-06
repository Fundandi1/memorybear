from django.contrib import admin
from core.models import Customer, Order, OrderItem, PaymentLog
from django.contrib import messages
from django.urls import reverse
from django.utils.html import format_html
from core.views import VippsMobilePayAPI
from django.http import HttpResponseRedirect
from django.urls import path
from django.shortcuts import get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required

# Initialize the API helper
api = VippsMobilePayAPI()

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
    list_display = ['reference', 'get_customer_name', 'amount_in_dkk', 'status', 'payment_method', 'payment_status', 'shipping_method', 'created_at']
    list_filter = ['status', 'payment_method', 'shipping_method', 'created_at', 'completed_at']
    search_fields = ['reference', 'customer__first_name', 'customer__last_name', 'customer__email']
    readonly_fields = ['reference', 'callback_token', 'created_at', 'updated_at', 'completed_at', 'payment_actions']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline, PaymentLogInline]
    actions = ['capture_payment_action', 'cancel_payment_action', 'refund_payment_action']
    
    fieldsets = [
        ('Order Information', {
            'fields': ['reference', 'customer', 'status', 'comments']
        }),
        ('Payment Details', {
            'fields': ['amount', 'currency', 'payment_method', 'payment_actions'],
            'classes': ['collapse in']
        }),
        ('Shipping Information', {
            'fields': ['shipping_method', 'shipping_cost', 'pickup_point_id'],
            'classes': ['collapse in']
        }),
        ('Technical Details', {
            'fields': ['callback_token', 'created_at', 'updated_at', 'completed_at'],
            'classes': ['collapse']
        }),
    ]
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'payment/<int:order_id>/capture/',
                self.admin_site.admin_view(self.capture_payment_view),
                name='capture_payment',
            ),
            path(
                'payment/<int:order_id>/cancel/',
                self.admin_site.admin_view(self.cancel_payment_view),
                name='cancel_payment',
            ),
            path(
                'payment/<int:order_id>/refund/',
                self.admin_site.admin_view(self.refund_payment_view),
                name='refund_payment',
            ),
            path(
                'payment/<int:order_id>/details/',
                self.admin_site.admin_view(self.view_transaction_details_view),
                name='view_transaction_details',
            ),
        ]
        return custom_urls + urls
    
    def capture_payment_view(self, request, order_id):
        """View for capturing payment from admin interface"""
        order = get_object_or_404(Order, id=order_id)
        
        try:
            # Get the latest payment log
            latest_log = order.payment_logs.order_by('-created_at').first()
            
            if latest_log and latest_log.status == 'AUTHORIZED':
                # Capture the payment
                response = api.capture_payment(order.reference, amount=order.amount)
                
                # Log the capture event
                PaymentLog.objects.create(
                    order=order,
                    transaction_id=latest_log.transaction_id,
                    event_type='CAPTURE',
                    amount=order.amount,
                    status='CAPTURED',
                    response_data=response
                )
                
                # Update order status
                order.status = 'PAYMENT_CONFIRMED'
                order.save()
                
                self.message_user(request, f"Payment for order {order.reference} successfully captured", level=messages.SUCCESS)
            else:
                self.message_user(
                    request, 
                    f"Cannot capture payment for order {order.reference} (status: {latest_log.status if latest_log else 'unknown'})",
                    level=messages.WARNING
                )
        except Exception as e:
            self.message_user(request, f"Error capturing payment: {str(e)}", level=messages.ERROR)
        
        # Redirect back to the order detail page
        return HttpResponseRedirect(
            reverse('admin:core_order_change', args=[order.id])
        )
    
    def cancel_payment_view(self, request, order_id):
        """View for cancelling payment from admin interface"""
        order = get_object_or_404(Order, id=order_id)
        
        try:
            # Get the latest payment log
            latest_log = order.payment_logs.order_by('-created_at').first()
            
            if latest_log and latest_log.status == 'AUTHORIZED':
                # Cancel the payment
                response = api.cancel_payment(order.reference)
                
                # Log the cancel event
                PaymentLog.objects.create(
                    order=order,
                    transaction_id=latest_log.transaction_id,
                    event_type='CANCEL',
                    amount=order.amount,
                    status='CANCELLED',
                    response_data=response
                )
                
                # Update order status
                order.status = 'SESSION_CANCELLED'
                order.save()
                
                self.message_user(request, f"Payment for order {order.reference} successfully cancelled", level=messages.SUCCESS)
            else:
                self.message_user(
                    request, 
                    f"Cannot cancel payment for order {order.reference} (status: {latest_log.status if latest_log else 'unknown'})",
                    level=messages.WARNING
                )
        except Exception as e:
            self.message_user(request, f"Error cancelling payment: {str(e)}", level=messages.ERROR)
        
        # Redirect back to the order detail page
        return HttpResponseRedirect(
            reverse('admin:core_order_change', args=[order.id])
        )
    
    def refund_payment_view(self, request, order_id):
        """View for refunding payment from admin interface"""
        order = get_object_or_404(Order, id=order_id)
        
        try:
            # Get the latest payment log
            latest_log = order.payment_logs.order_by('-created_at').first()
            
            if latest_log and latest_log.status == 'CAPTURED':
                # Refund the payment
                response = api.refund_payment(order.reference, amount=order.amount)
                
                # Log the refund event
                PaymentLog.objects.create(
                    order=order,
                    transaction_id=latest_log.transaction_id,
                    event_type='REFUND',
                    amount=order.amount,
                    status='REFUNDED',
                    response_data=response
                )
                
                # Update order status
                order.status = 'REFUNDED'
                order.save()
                
                self.message_user(request, f"Payment for order {order.reference} successfully refunded", level=messages.SUCCESS)
            else:
                self.message_user(
                    request, 
                    f"Cannot refund payment for order {order.reference} (status: {latest_log.status if latest_log else 'unknown'})",
                    level=messages.WARNING
                )
        except Exception as e:
            self.message_user(request, f"Error refunding payment: {str(e)}", level=messages.ERROR)
        
        # Redirect back to the order detail page
        return HttpResponseRedirect(
            reverse('admin:core_order_change', args=[order.id])
        )
    
    def view_transaction_details_view(self, request, order_id):
        """View for displaying transaction details from Vipps/MobilePay"""
        order = get_object_or_404(Order, id=order_id)
        
        try:
            # Get payment details from the API
            payment_details = api.get_payment_details(order.reference)
            
            # Format the payment details for display
            formatted_details = [
                f"<h2>Transaction Details for Order {order.reference}</h2>",
                "<table>",
                f"<tr><th>Status</th><td>{payment_details.get('state', 'Unknown')}</td></tr>",
                f"<tr><th>Amount</th><td>{payment_details.get('amount', {}).get('value', 'Unknown')} {payment_details.get('amount', {}).get('currency', '')}</td></tr>",
                f"<tr><th>Transaction ID</th><td>{payment_details.get('paymentId', 'Unknown')}</td></tr>"
            ]
            
            # Add payment events if available
            if 'events' in payment_details:
                formatted_details.append("<tr><th colspan='2'>Payment Events</th></tr>")
                for event in payment_details.get('events', []):
                    formatted_details.append(f"<tr><td>{event.get('type', 'Unknown')}</td><td>{event.get('timeStamp', 'Unknown')}</td></tr>")
            
            formatted_details.append("</table>")
            formatted_details.append("<h3>Raw Response Data</h3>")
            formatted_details.append(f"<pre>{payment_details}</pre>")
            
            # Return a simple response with the formatted details
            from django.http import HttpResponse
            return HttpResponse(format_html("".join(formatted_details)))
            
        except Exception as e:
            self.message_user(request, f"Error retrieving transaction details: {str(e)}", level=messages.ERROR)
            return HttpResponseRedirect(
                reverse('admin:core_order_change', args=[order.id])
            )
    
    def get_customer_name(self, obj):
        if obj.customer:
            return f"{obj.customer.first_name} {obj.customer.last_name}"
        return "Guest"
    get_customer_name.short_description = "Customer"
    
    def amount_in_dkk(self, obj):
        return f"{obj.amount / 100:.2f} DKK"
    amount_in_dkk.short_description = "Amount"
    
    def payment_status(self, obj):
        try:
            # Get the latest payment log
            latest_log = obj.payment_logs.order_by('-created_at').first()
            if latest_log:
                status = latest_log.status
                if status == 'AUTHORIZED':
                    return format_html('<span style="color: green;">{}</span>', status)
                elif status in ['CANCELLED', 'FAILED']:
                    return format_html('<span style="color: red;">{}</span>', status)
                return status
            return "Unknown"
        except Exception as e:
            return f"Error: {str(e)}"
    payment_status.short_description = "Payment Status"
    
    def payment_actions(self, obj):
        """Display payment action buttons in the order detail view"""
        # Get the latest payment log to determine available actions
        latest_log = obj.payment_logs.order_by('-created_at').first()
        if not latest_log:
            return "No payment information available"
        
        status = latest_log.status
        actions = []
        
        if status == 'AUTHORIZED':
            capture_url = reverse('admin:capture_payment', args=[obj.pk])
            cancel_url = reverse('admin:cancel_payment', args=[obj.pk])
            actions.append(f'<a class="button" href="{capture_url}">Capture Payment</a>')
            actions.append(f'<a class="button" href="{cancel_url}">Cancel Payment</a>')
        elif status == 'CAPTURED':
            refund_url = reverse('admin:refund_payment', args=[obj.pk])
            actions.append(f'<a class="button" href="{refund_url}">Refund Payment</a>')
        
        # Add a button to view transaction details
        details_url = reverse('admin:view_transaction_details', args=[obj.pk])
        actions.append(f'<a class="button" href="{details_url}">View Transaction Details</a>')
        
        if actions:
            return format_html('&nbsp;'.join(actions))
        return "No actions available"
    payment_actions.short_description = "Payment Actions"
    
    def capture_payment_action(self, request, queryset):
        """Admin action to capture payments for selected orders"""
        success_count = 0
        for order in queryset:
            try:
                # Get the latest payment log to check if it's in AUTHORIZED state
                latest_log = order.payment_logs.order_by('-created_at').first()
                if latest_log and latest_log.status == 'AUTHORIZED':
                    # Capture the payment
                    response = api.capture_payment(order.reference, amount=order.amount)
                    
                    # Log the capture event
                    PaymentLog.objects.create(
                        order=order,
                        transaction_id=latest_log.transaction_id,
                        event_type='CAPTURE',
                        amount=order.amount,
                        status='CAPTURED',
                        response_data=response
                    )
                    
                    # Update order status
                    order.status = 'PAYMENT_CONFIRMED'
                    order.save()
                    
                    success_count += 1
                else:
                    self.message_user(
                        request, 
                        f"Order {order.reference} cannot be captured (status: {latest_log.status if latest_log else 'unknown'})",
                        level=messages.WARNING
                    )
            except Exception as e:
                self.message_user(request, f"Error capturing payment for {order.reference}: {str(e)}", level=messages.ERROR)
        
        if success_count:
            self.message_user(request, f"Successfully captured payment for {success_count} orders", level=messages.SUCCESS)
    capture_payment_action.short_description = "Capture selected payments"
    
    def cancel_payment_action(self, request, queryset):
        """Admin action to cancel payments for selected orders"""
        success_count = 0
        for order in queryset:
            try:
                # Get the latest payment log to check if it's in AUTHORIZED state
                latest_log = order.payment_logs.order_by('-created_at').first()
                if latest_log and latest_log.status == 'AUTHORIZED':
                    # Cancel the payment
                    response = api.cancel_payment(order.reference)
                    
                    # Log the cancel event
                    PaymentLog.objects.create(
                        order=order,
                        transaction_id=latest_log.transaction_id,
                        event_type='CANCEL',
                        amount=order.amount,
                        status='CANCELLED',
                        response_data=response
                    )
                    
                    # Update order status
                    order.status = 'SESSION_CANCELLED'
                    order.save()
                    
                    success_count += 1
                else:
                    self.message_user(
                        request, 
                        f"Order {order.reference} cannot be cancelled (status: {latest_log.status if latest_log else 'unknown'})",
                        level=messages.WARNING
                    )
            except Exception as e:
                self.message_user(request, f"Error cancelling payment for {order.reference}: {str(e)}", level=messages.ERROR)
        
        if success_count:
            self.message_user(request, f"Successfully cancelled payment for {success_count} orders", level=messages.SUCCESS)
    cancel_payment_action.short_description = "Cancel selected payments"
    
    def refund_payment_action(self, request, queryset):
        """Admin action to refund payments for selected orders"""
        success_count = 0
        for order in queryset:
            try:
                # Get the latest payment log to check if it's in CAPTURED state
                latest_log = order.payment_logs.order_by('-created_at').first()
                if latest_log and latest_log.status == 'CAPTURED':
                    # Refund the payment
                    response = api.refund_payment(order.reference, amount=order.amount)
                    
                    # Log the refund event
                    PaymentLog.objects.create(
                        order=order,
                        transaction_id=latest_log.transaction_id,
                        event_type='REFUND',
                        amount=order.amount,
                        status='REFUNDED',
                        response_data=response
                    )
                    
                    # Update order status
                    order.status = 'REFUNDED'
                    order.save()
                    
                    success_count += 1
                else:
                    self.message_user(
                        request, 
                        f"Order {order.reference} cannot be refunded (status: {latest_log.status if latest_log else 'unknown'})",
                        level=messages.WARNING
                    )
            except Exception as e:
                self.message_user(request, f"Error refunding payment for {order.reference}: {str(e)}", level=messages.ERROR)
        
        if success_count:
            self.message_user(request, f"Successfully refunded payment for {success_count} orders", level=messages.SUCCESS)
    refund_payment_action.short_description = "Refund selected payments"

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

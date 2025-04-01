from django.shortcuts import render
import requests
import json
import uuid
import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from .models import Order, Customer, OrderItem, PaymentLog

class VippsMobilePayAPI:
    """Helper class to handle Vipps MobilePay API calls"""
    
    # Base URLs
    TEST_BASE_URL = "https://apitest.vipps.no"
    PROD_BASE_URL = "https://api.vipps.no"
    
    def __init__(self):
        # Get settings from Django settings
        self.client_id = settings.VIPPS_CLIENT_ID
        self.client_secret = settings.VIPPS_CLIENT_SECRET
        self.subscription_key = settings.VIPPS_SUBSCRIPTION_KEY
        self.merchant_serial_number = settings.VIPPS_MERCHANT_SERIAL_NUMBER
        self.is_test = getattr(settings, 'VIPPS_TEST_MODE', True)
        
        # System headers
        self.system_name = "MemorybearWebapp"
        self.system_version = "1.0.0"
        self.plugin_name = "MemorybearCheckout"
        self.plugin_version = "1.0.0"
        
    @property
    def base_url(self):
        return self.TEST_BASE_URL if self.is_test else self.PROD_BASE_URL
    
    def get_headers(self):
        """Return common headers for API requests"""
        return {
            "Content-Type": "application/json",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Merchant-Serial-Number": self.merchant_serial_number,
            "Vipps-System-Name": self.system_name,
            "Vipps-System-Version": self.system_version,
            "Vipps-System-Plugin-Name": self.plugin_name,
            "Vipps-System-Plugin-Version": self.plugin_version
        }
    
    def create_checkout_session(self, amount, currency, reference, description, callback_url, return_url):
        """Create a checkout session with Vipps MobilePay"""
        url = f"{self.base_url}/checkout/v3/session"
        
        # Generate a unique authorization token for callbacks
        callback_token = str(uuid.uuid4())
        
        payload = {
            "merchantInfo": {
                "callbackUrl": callback_url,
                "returnUrl": return_url,
                "callbackAuthorizationToken": callback_token
            },
            "transaction": {
                "amount": {
                    "value": amount,
                    "currency": currency
                },
                "reference": reference,
                "paymentDescription": description
            }
        }
        
        try:
            response = requests.post(url, headers=self.get_headers(), json=payload)
            response.raise_for_status()  # Raise an error for bad responses
            return response.json(), callback_token
        except requests.exceptions.RequestException as e:
            # Log the error for debugging
            print(f"API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response content: {e.response.content}")
            # Re-raise as a more general error
            raise Exception(f"Failed to connect to Vipps/MobilePay API: {str(e)}")
    
    def get_session_details(self, reference):
        """Get details of a checkout session"""
        url = f"{self.base_url}/checkout/v3/session/{reference}"
        try:
            response = requests.get(url, headers=self.get_headers())
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response content: {e.response.content}")
            raise Exception(f"Failed to get session details: {str(e)}")

    def get_payment_details(self, reference):
        """Get payment details from ePayment API"""
        url = f"{self.base_url}/epayment/v1/{reference}"
        try:
            response = requests.get(url, headers=self.get_headers())
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            raise Exception(f"Failed to get payment details: {str(e)}")
    
    def cancel_payment(self, reference):
        """Cancel a payment"""
        url = f"{self.base_url}/epayment/v1/{reference}/cancel"
        try:
            response = requests.post(url, headers=self.get_headers(), json={})
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            raise Exception(f"Failed to cancel payment: {str(e)}")
    
    def capture_payment(self, reference, amount=None, description=None):
        """Capture a payment, either partially or fully"""
        url = f"{self.base_url}/epayment/v1/{reference}/capture"
        payload = {}
        
        if amount is not None:
            payload["modificationAmount"] = {
                "value": amount,
                "currency": "DKK"  # Using DKK as default currency
            }
            
        if description is not None:
            payload["description"] = description
            
        try:
            response = requests.post(url, headers=self.get_headers(), json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            raise Exception(f"Failed to capture payment: {str(e)}")
    
    def refund_payment(self, reference, amount=None, description=None):
        """Refund a payment, either partially or fully"""
        url = f"{self.base_url}/epayment/v1/{reference}/refund"
        payload = {}
        
        if amount is not None:
            payload["modificationAmount"] = {
                "value": amount,
                "currency": "DKK"  # Using DKK as default currency
            }
            
        if description is not None:
            payload["description"] = description
            
        try:
            response = requests.post(url, headers=self.get_headers(), json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            raise Exception(f"Failed to refund payment: {str(e)}")

# Initialize the API helper
api = VippsMobilePayAPI()

@csrf_exempt
@require_http_methods(["POST"])
def create_checkout(request):
    """Create a checkout session and return the session token"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['amount', 'currency']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return JsonResponse(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=400
            )

        # Create a unique reference for this order
        reference = data.get('reference', f"order-{uuid.uuid4().hex[:8]}")
        
        # Check if customer data is provided
        customer = None
        customer_data = data.get('customer', {})
        if customer_data and customer_data.get('email'):
            # Create or update customer
            customer, created = Customer.objects.update_or_create(
                email=customer_data.get('email'),
                defaults={
                    'first_name': customer_data.get('firstName', ''),
                    'last_name': customer_data.get('lastName', ''),
                    'phone': customer_data.get('phone', ''),
                    'address': customer_data.get('address', ''),
                    'postal_code': customer_data.get('postalCode', ''),
                    'city': customer_data.get('city', ''),
                    'marketing_consent': customer_data.get('marketingConsent', False),
                }
            )
        
        # Determine the callback URL and return URL
        callback_url = request.build_absolute_uri('/api/checkout/callback/')
        return_url = data.get('return_url', request.build_absolute_uri('/checkout/complete/'))
        
        # Create checkout session with Vipps/MobilePay
        try:
            result, callback_token = api.create_checkout_session(
                amount=data['amount'],
                currency=data['currency'],
                reference=reference,
                description=data.get('description', 'Purchase from Mindebamsen'),
                callback_url=callback_url,
                return_url=return_url
            )
        except Exception as api_error:
            print(f"Vipps API Error: {str(api_error)}")
            return JsonResponse(
                {'error': f'Payment gateway error: {str(api_error)}'},
                status=502
            )
        
        # Store the order in the database
        order = Order.objects.create(
            reference=reference,
            customer=customer,
            callback_token=callback_token,
            amount=data['amount'],
            currency=data['currency'],
            status='CREATED',
            shipping_method=data.get('shippingMethod', 'home'),
            shipping_cost=data.get('shippingCost', 4900),  # in øre, default to 49 DKK
            pickup_point_id=data.get('pickupPointId', None),
            payment_method=data.get('paymentMethod', 'mobilepay'),
            comments=data.get('comments', None)
        )
        
        # Store order items if provided
        items_data = data.get('items', [])
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                name=item_data.get('name', 'MemoryBear'),
                price=item_data.get('price', 0),  # Already in øre from the frontend
                quantity=item_data.get('quantity', 1),
                fabric_type=item_data.get('fabricType', None),
                body_fabric=item_data.get('bodyFabric', None),
                head_fabric=item_data.get('headFabric', None),
                under_arms_fabric=item_data.get('underArmsFabric', None),
                belly_fabric=item_data.get('bellyFabric', None),
                has_vest=item_data.get('hasVest', False),
                vest_fabric=item_data.get('vestFabric', None),
                face_style=item_data.get('faceStyle', None)
            )
        
        # Log payment event
        PaymentLog.objects.create(
            order=order,
            event_type='CHECKOUT_CREATED',
            status='CREATED',
            response_data=result
        )
        
        return JsonResponse(result)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        # Log the full exception for debugging
        import traceback
        print(f"Error creating checkout: {str(e)}")
        print(traceback.format_exc())
        
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def get_checkout_session(request, reference):
    """Get checkout session details"""
    try:
        result = api.get_session_details(reference)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def get_payment(request, reference):
    """Get payment details"""
    try:
        result = api.get_payment_details(reference)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
@require_http_methods(["POST"])
def callback_handler(request):
    """Handle callbacks from Vipps MobilePay"""
    try:
        # Extract information from callback
        data = json.loads(request.body)
        reference = data.get('reference')
        
        # Verify the authorization token
        auth_token = request.headers.get('Authorization')
        if not auth_token:
            print("Missing Authorization header in callback")
            # Always return 200 OK to Vipps/MobilePay
            return JsonResponse({"status": "OK"})
        
        # Find the order in our database
        try:
            order = Order.objects.get(reference=reference)
            
            # Verify the callback token
            if order.callback_token != auth_token:
                print(f"Invalid token: expected {order.callback_token}, got {auth_token}")
                return JsonResponse({"status": "OK"})  # Still return 200 OK
            
            # Map Vipps/MobilePay status to our system status
            transaction_status = data.get('transactionStatus', {}).get('status')
            session_state = data.get('sessionState')
            
            if transaction_status:
                if transaction_status == 'AUTHORIZED':
                    order.status = 'PAYMENT_CONFIRMED'
                elif transaction_status == 'FAILED' or transaction_status == 'CANCELLED':
                    order.status = 'PAYMENT_FAILED'
                else:
                    order.status = transaction_status
                    
            elif session_state:
                if session_state == 'SessionCompleted':
                    order.status = 'SESSION_COMPLETED'
                elif session_state == 'SessionFailed':
                    order.status = 'SESSION_FAILED'
                elif session_state == 'SessionCancelled':
                    order.status = 'SESSION_CANCELLED'
                    
            # Update order completed_at timestamp if payment confirmed
            if order.status == 'PAYMENT_CONFIRMED':
                order.completed_at = datetime.datetime.now()
                
            order.save()
            
            # Log the callback data
            PaymentLog.objects.create(
                order=order,
                event_type='CALLBACK_RECEIVED',
                status=order.status,
                transaction_id=data.get('transactionInfo', {}).get('transactionId'),
                response_data=data
            )
                
        except Order.DoesNotExist:
            print(f"Order not found: {reference}")
            
    except Exception as e:
        # Log the error but still return 200 OK as required by Vipps
        import traceback
        print(f"Error processing callback: {str(e)}")
        print(traceback.format_exc())
    
    # Always return a 200 OK response to Vipps MobilePay
    return JsonResponse({"status": "OK"})

@csrf_exempt
@require_http_methods(["POST"])
def capture_payment_view(request, reference):
    """Capture a payment"""
    try:
        data = json.loads(request.body)
        amount = data.get('amount')
        description = data.get('description', 'Capture from Mindebamsen')
        
        result = api.capture_payment(reference, amount, description)
        
        # Update order status
        try:
            order = Order.objects.get(reference=reference)
            order.status = 'COMPLETED'
            order.save()
            
            # Log capture event
            PaymentLog.objects.create(
                order=order,
                event_type='PAYMENT_CAPTURED',
                status='COMPLETED',
                amount=amount,
                response_data=result
            )
        except Order.DoesNotExist:
            pass
        
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def refund_payment_view(request, reference):
    """Refund a payment"""
    try:
        data = json.loads(request.body)
        amount = data.get('amount')
        description = data.get('description', 'Refund from Mindebamsen')
        
        result = api.refund_payment(reference, amount, description)
        
        # Update order status
        try:
            order = Order.objects.get(reference=reference)
            order.status = 'REFUNDED'
            order.save()
            
            # Log refund event
            PaymentLog.objects.create(
                order=order,
                event_type='PAYMENT_REFUNDED',
                status='REFUNDED',
                amount=amount,
                response_data=result
            )
        except Order.DoesNotExist:
            pass
        
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def cancel_payment_view(request, reference):
    """Cancel a payment"""
    try:
        result = api.cancel_payment(reference)
        
        # Update order status
        try:
            order = Order.objects.get(reference=reference)
            order.status = 'PAYMENT_FAILED'
            order.save()
            
            # Log cancel event
            PaymentLog.objects.create(
                order=order,
                event_type='PAYMENT_CANCELLED',
                status='PAYMENT_FAILED',
                response_data=result
            )
        except Order.DoesNotExist:
            pass
        
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def checkout_page(request):
    return render(request, 'checkout.html')

def checkout_complete(request):
    # This page is shown when the user returns from Vipps
    return render(request, 'checkout_complete.html')

# Serve Next.js frontend
index_view = never_cache(TemplateView.as_view(template_name='index.html'))
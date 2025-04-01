from django.shortcuts import render
import requests
import json
import uuid
import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Order, Customer, OrderItem, PaymentLog
import re

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
        
        response = requests.post(url, headers=self.get_headers(), json=payload)
        return response.json(), callback_token
    
    def get_session_details(self, reference):
        """Get details of a checkout session"""
        url = f"{self.base_url}/checkout/v3/session/{reference}"
        response = requests.get(url, headers=self.get_headers())
        return response.json()

    def get_payment_details(self, reference):
        """Get payment details from ePayment API"""
        url = f"{self.base_url}/epayment/v1/{reference}"
        response = requests.get(url, headers=self.get_headers())
        return response.json()
    
    def cancel_payment(self, reference):
        """Cancel a payment"""
        url = f"{self.base_url}/epayment/v1/{reference}/cancel"
        response = requests.post(url, headers=self.get_headers(), json={})
        return response.json()
    
    def capture_payment(self, reference, amount=None, description=None):
        """Capture a payment, either partially or fully"""
        url = f"{self.base_url}/epayment/v1/{reference}/capture"
        payload = {}
        
        if amount is not None:
            payload["modificationAmount"] = {
                "value": amount,
                "currency": "NOK"  # You might want to make this dynamic
            }
            
        if description is not None:
            payload["description"] = description
            
        response = requests.post(url, headers=self.get_headers(), json=payload)
        return response.json()
    
    def refund_payment(self, reference, amount=None, description=None):
        """Refund a payment, either partially or fully"""
        url = f"{self.base_url}/epayment/v1/{reference}/refund"
        payload = {}
        
        if amount is not None:
            payload["modificationAmount"] = {
                "value": amount,
                "currency": "NOK"  # You might want to make this dynamic
            }
            
        if description is not None:
            payload["description"] = description
            
        response = requests.post(url, headers=self.get_headers(), json=payload)
        return response.json()

# Initialize the API helper
api = VippsMobilePayAPI()

@api_view(['POST'])
def create_checkout(request):
    """Create a checkout session and return the session token"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['amount', 'currency']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return Response(
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
        
        # Create checkout session
        result, callback_token = api.create_checkout_session(
            amount=data['amount'],
            currency=data['currency'],
            reference=reference,
            description=data.get('description', 'Purchase from Mindebamsen'),
            callback_url=request.build_absolute_uri('/api/checkout/callback/'),
            return_url=data.get('return_url', request.build_absolute_uri('/checkout/complete/'))
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
            shipping_cost=4900 if data.get('shippingMethod') == 'home' else 3900,  # in øre
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
                price=item_data.get('price', 0) * 100,  # Convert to øre
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
        
        return Response(result)
        
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_checkout_session(request, reference):
    """Get checkout session details"""
    result = api.get_session_details(reference)
    return Response(result)

@api_view(['GET'])
def get_payment(request, reference):
    """Get payment details"""
    result = api.get_payment_details(reference)
    return Response(result)

@csrf_exempt
@require_http_methods(["POST"])
def callback_handler(request):
    """Handle callbacks from Vipps MobilePay"""
    try:
        # Extract information from callback
        data = json.loads(request.body)
        reference = data.get('reference')
        
        # Verify the authorization token
        auth_token = request.headers.get('Authorization')
        
        # Find the order in our database
        try:
            order = Order.objects.get(reference=reference)
            
            # Verify the callback token
            if order.callback_token != auth_token:
                return JsonResponse({"error": "Invalid authorization token"}, status=401)
            
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
            return JsonResponse({"error": "Order not found"}, status=404)
            
    except Exception as e:
        # Log the error but still return 200 OK as required by Vipps
        print(f"Error processing callback: {str(e)}")
    
    # Always return a 200 OK response to Vipps MobilePay
    return JsonResponse({"status": "OK"})

@api_view(['POST'])
def capture_payment_view(request, reference):
    """Capture a payment"""
    data = json.loads(request.body)
    amount = data.get('amount')
    description = data.get('description', 'Capture from Mindebamsen')
    
    result = api.capture_payment(reference, amount, description)
    return Response(result)

@api_view(['POST'])
def refund_payment_view(request, reference):
    """Refund a payment"""
    data = json.loads(request.body)
    amount = data.get('amount')
    description = data.get('description', 'Refund from Mindebamsen')
    
    result = api.refund_payment(reference, amount, description)
    return Response(result)

@api_view(['POST'])
def cancel_payment_view(request, reference):
    """Cancel a payment"""
    result = api.cancel_payment(reference)
    return Response(result)

def checkout_page(request):
    return render(request, 'checkout.html')

def checkout_complete(request):
    # This page is shown when the user returns from Vipps
    return render(request, 'checkout_complete.html')

@api_view(['POST'])
def create_customer(request):
    """Create or update a customer"""
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['email', 'first_name', 'last_name', 'phone', 'address', 'postal_code', 'city']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=400
            )

        # Validate phone number format (Danish format)
        phone = data.get('phone', '').replace(' ', '')
        if not re.match(r'^(\+45)?[0-9]{8}$', phone):
            return Response(
                {'error': 'Invalid phone number format. Please use Danish format (8 digits)'},
                status=400
            )

        # Validate postal code (Danish format)
        if not re.match(r'^[0-9]{4}$', data.get('postal_code', '')):
            return Response(
                {'error': 'Invalid postal code format. Please use Danish format (4 digits)'},
                status=400
            )

        # Create or update customer
        customer, created = Customer.objects.update_or_create(
            email=data['email'],
            defaults={
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'phone': phone,
                'address': data['address'],
                'postal_code': data['postal_code'],
                'city': data['city'],
                'marketing_consent': data.get('marketing_consent', False),
            }
        )
        
        return Response({
            'id': customer.id,
            'email': customer.email,
            'created': created
        })
        
    except Exception as e:
        print(f"Error creating customer: {str(e)}")
        return Response(
            {'error': 'Could not process customer information'},
            status=500
        )

@api_view(['GET'])
def health_check(request):
    """
    Simple health check endpoint to verify API is accessible
    """
    return Response({
        "status": "healthy",
        "message": "API is running"
    })

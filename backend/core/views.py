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
        
        # MobilePay specific settings
        self.mobilepay_api_endpoint = settings.MOBILEPAY_API_ENDPOINT
        self.checkout_return_url = settings.MOBILEPAY_CHECKOUT_RETURN_URL
        self.checkout_callback_url = settings.MOBILEPAY_CHECKOUT_CALLBACK_URL
        
        # System headers
        self.system_name = "MemorybearWebapp"
        self.system_version = "1.0.0"
        self.plugin_name = "MemorybearCheckout"
        self.plugin_version = "1.0.0"
        
    @property
    def base_url(self):
        return self.TEST_BASE_URL if self.is_test else self.PROD_BASE_URL
    
    @property
    def mobilepay_url(self):
        return self.mobilepay_api_endpoint
    
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
    
    def get_epayment_headers(self):
        """Return headers specifically formatted for ePayment API"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.client_id}",  # ePayment might use this format
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
        try:
            # First, get an access token
            token_url = f"{self.base_url}/accesstoken/get"
            token_headers = {
                "Content-Type": "application/json",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "Ocp-Apim-Subscription-Key": self.subscription_key
            }
            
            token_response = requests.post(token_url, headers=token_headers)
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise Exception("Failed to obtain access token")
            
            # Now get the payment details with the access token
            # Use the payments endpoint - make sure we're hitting the right URL
            url = f"{self.base_url}/epayment/v1/payments/{reference}"
            
            print(f"Fetching payment details from: {url}")
            
            # Ensure all required headers are present and correctly formatted
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Merchant-Serial-Number": self.merchant_serial_number,
                "Vipps-System-Name": self.system_name,
                "Vipps-System-Version": self.system_version,
                "Vipps-System-Plugin-Name": self.plugin_name,
                "Vipps-System-Plugin-Version": self.plugin_version
            }
            
            print(f"Using MSN: {self.merchant_serial_number}")
            
            response = requests.get(url, headers=headers)
            
            # Log response details for debugging
            print(f"Response status code: {response.status_code}")
            if response.status_code != 200:
                print(f"Response content: {response.content}")
            else:
                # Print structure of successful response for debugging
                try:
                    data = response.json()
                    print(f"Payment details structure: {json.dumps(data, indent=2)}")
                    
                    # Log specific important fields to check their presence and format
                    print(f"Payment state: {data.get('state')}")
                    if 'summary' in data:
                        print(f"Payment summary: {json.dumps(data['summary'], indent=2)}")
                    else:
                        print("Payment summary field not found")
                    
                    # Check if the authorizedAmount is available and in the expected format
                    authorized_amount = None
                    if 'summary' in data and 'authorizedAmount' in data['summary']:
                        authorized_amount = data['summary']['authorizedAmount']
                        print(f"Authorized amount: {authorized_amount}")
                    elif 'amount' in data:
                        authorized_amount = data['amount']
                        print(f"Using amount field: {authorized_amount}")
                    else:
                        print("No amount field found in the response")
                except Exception as parse_error:
                    print(f"Error parsing response JSON: {str(parse_error)}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response status: {e.response.status_code}")
                print(f"Response content: {e.response.content}")
            
            # Check for common errors and provide better error messages
            if hasattr(e, 'response'):
                if e.response.status_code == 404:
                    error_msg = f"Payment with reference '{reference}' not found. Verify the reference is correct and exists in the MobilePay system."
                elif e.response.status_code == 401:
                    error_msg = "Authorization failed. Check your API keys and credentials."
                elif e.response.status_code == 403:
                    error_msg = "Access forbidden. Your account may not have permission to access this payment."
                else:
                    error_msg = f"Failed to get payment details: {str(e)}"
                raise Exception(error_msg)
            else:
                raise Exception(f"Failed to get payment details: {str(e)}")
    
    def cancel_payment(self, reference):
        """Cancel a payment"""
        url = f"{self.base_url}/epayment/v1/payments/{reference}/cancel"
        try:
            # First, get an access token
            token_url = f"{self.base_url}/accesstoken/get"
            token_headers = {
                "Content-Type": "application/json",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "Ocp-Apim-Subscription-Key": self.subscription_key
            }
            
            token_response = requests.post(token_url, headers=token_headers)
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise Exception("Failed to obtain access token")
            
            # Generate a shorter idempotency key - max 50 chars
            short_uuid = str(uuid.uuid4()).replace('-', '')[:8]
            idempotency_key = f"cnl-{reference}-{short_uuid}"
            
            # Make sure the key doesn't exceed 50 chars
            if len(idempotency_key) > 50:
                # Further shorten if needed
                ref_max_len = 50 - 13  # 'cnl-' (4) + '-' (1) + short_uuid (8)
                idempotency_key = f"cnl-{reference[:ref_max_len]}-{short_uuid}"
            
            print(f"Using idempotency key: {idempotency_key} (length: {len(idempotency_key)})")
            
            # Use the access token for the API call
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Merchant-Serial-Number": self.merchant_serial_number,
                "Idempotency-Key": idempotency_key,
                "Vipps-System-Name": self.system_name,
                "Vipps-System-Version": self.system_version,
                "Vipps-System-Plugin-Name": self.plugin_name,
                "Vipps-System-Plugin-Version": self.plugin_version
            }
            
            print(f"Cancelling payment at: {url}")
            response = requests.post(url, headers=headers, json={})
            
            # Log response details for debugging
            print(f"Response status code: {response.status_code}")
            if response.status_code != 200:
                print(f"Response content: {response.content}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response status: {e.response.status_code}")
                print(f"Response content: {e.response.content}")
            raise Exception(f"Failed to cancel payment: {str(e)}")
    
    def capture_payment(self, reference, amount=None, description=None):
        """Capture a payment, either partially or fully"""
        url = f"{self.base_url}/epayment/v1/payments/{reference}/capture"
        payload = {}
        
        if amount is not None:
            payload["modificationAmount"] = {
                "value": amount,
                "currency": "DKK"  # Using DKK as default currency
            }
            
        if description is not None:
            payload["description"] = description
            
        try:
            # First, get an access token
            token_url = f"{self.base_url}/accesstoken/get"
            token_headers = {
                "Content-Type": "application/json",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "Ocp-Apim-Subscription-Key": self.subscription_key
            }
            
            token_response = requests.post(token_url, headers=token_headers)
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise Exception("Failed to obtain access token")
            
            # Generate a shorter idempotency key - max 50 chars
            # Use first 8 chars of UUID instead of the full UUID
            short_uuid = str(uuid.uuid4()).replace('-', '')[:8]
            idempotency_key = f"cap-{reference}-{short_uuid}"
            
            # Make sure the key doesn't exceed 50 chars
            if len(idempotency_key) > 50:
                # Further shorten if needed
                ref_max_len = 50 - 13  # 'cap-' (4) + '-' (1) + short_uuid (8)
                idempotency_key = f"cap-{reference[:ref_max_len]}-{short_uuid}"
            
            print(f"Using idempotency key: {idempotency_key} (length: {len(idempotency_key)})")
            
            # Use the access token for the API call
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Merchant-Serial-Number": self.merchant_serial_number,
                "Idempotency-Key": idempotency_key,  # Use the shortened key we generated above
                "Vipps-System-Name": self.system_name,
                "Vipps-System-Version": self.system_version,
                "Vipps-System-Plugin-Name": self.plugin_name,
                "Vipps-System-Plugin-Version": self.plugin_version
            }
            
            print(f"Capturing payment at: {url}")
            print(f"Capture payload: {json.dumps(payload)}")
            
            response = requests.post(url, headers=headers, json=payload)
            
            # Log response details for debugging
            print(f"Response status code: {response.status_code}")
            if response.status_code != 200:
                print(f"Response content: {response.content}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response status: {e.response.status_code}")
                print(f"Response content: {e.response.content}")
            raise Exception(f"Failed to capture payment: {str(e)}")
    
    def refund_payment(self, reference, amount=None, description=None):
        """Refund a payment, either partially or fully"""
        url = f"{self.base_url}/epayment/v1/payments/{reference}/refund"
        payload = {}
        
        if amount is not None:
            payload["modificationAmount"] = {
                "value": amount,
                "currency": "DKK"  # Using DKK as default currency
            }
            
        if description is not None:
            payload["description"] = description
            
        try:
            # First, get an access token
            token_url = f"{self.base_url}/accesstoken/get"
            token_headers = {
                "Content-Type": "application/json",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "Ocp-Apim-Subscription-Key": self.subscription_key
            }
            
            token_response = requests.post(token_url, headers=token_headers)
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise Exception("Failed to obtain access token")
            
            # Generate a idempotency key.
            short_uuid = str(uuid.uuid4()).replace('-', '')[:8]
            idempotency_key = f"ref-{reference}-{short_uuid}"
            
            # Make sure the key doesn't exceed 50 chars
            if len(idempotency_key) > 50:
                # Further shorten if needed
                ref_max_len = 50 - 13  # 'ref-' (4) + '-' (1) + short_uuid (8)
                idempotency_key = f"ref-{reference[:ref_max_len]}-{short_uuid}"
            
            print(f"Using idempotency key: {idempotency_key} (length: {len(idempotency_key)})")
            
            # Use the access token for the API call
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Merchant-Serial-Number": self.merchant_serial_number,
                "Idempotency-Key": idempotency_key,
                "Vipps-System-Name": self.system_name,
                "Vipps-System-Version": self.system_version,
                "Vipps-System-Plugin-Name": self.plugin_name,
                "Vipps-System-Plugin-Version": self.plugin_version
            }
            
            print(f"Refunding payment at: {url}")
            print(f"Refund payload: {json.dumps(payload)}")
            
            response = requests.post(url, headers=headers, json=payload)
            
            # Log response details for debugging
            print(f"Response status code: {response.status_code}")
            if response.status_code != 200:
                print(f"Response content: {response.content}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response status: {e.response.status_code}")
                print(f"Response content: {e.response.content}")
            raise Exception(f"Failed to refund payment: {str(e)}")

    def create_mobilepay_checkout(self, amount, reference, description, return_url=None, callback_url=None, customer_phone=None):
        """Create a MobilePay checkout session using the ePayment API"""
        try:
            # First, get an access token - note that the endpoint is accesstoken (lowercase t)
            token_url = f"{self.base_url}/accesstoken/get"
            token_headers = {
                "Content-Type": "application/json",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "Ocp-Apim-Subscription-Key": self.subscription_key
            }
            
            print(f"Getting access token from: {token_url}")
            print(f"Using client_id: {self.client_id}")
            # Don't log the full client_secret for security reasons
            print(f"Using client_secret: {self.client_secret[:4]}...{self.client_secret[-4:]}")
            print(f"Using subscription_key: {self.subscription_key[:4]}...{self.subscription_key[-4:]}")
            
            token_response = requests.post(token_url, headers=token_headers)
            
            print(f"Token response status code: {token_response.status_code}")
            if token_response.status_code != 200:
                print(f"Token response content: {token_response.content}")
                
            token_response.raise_for_status()
            token_data = token_response.json()
            print(f"Token response keys: {token_data.keys()}")
            
            access_token = token_data.get("access_token")
            
            if not access_token:
                print("Failed to obtain access token. Token data:", token_data)
                raise Exception("Failed to obtain access token")
                
            print(f"Successfully obtained access token: {access_token[:10]}...")
                
            # Now create the payment with the access token
            url = f"{self.base_url}/epayment/v1/payments"
            
            # Use default URLs if not provided
            if return_url is None:
                return_url = self.checkout_return_url
            if callback_url is None:
                callback_url = self.checkout_callback_url
            
            
            payload = {
                "amount": {
                    "value": amount,
                    "currency": "DKK"
                },
                "paymentMethod": {
                    "type": "WALLET"
                },
                # Required for wallet payments
                "customerInteraction": "CUSTOMER_PRESENT",
                "reference": reference,
                "paymentDescription": description,
                "returnUrl": return_url,
                "userFlow": "WEB_REDIRECT",
                "webhookUrl": callback_url
            }
            
            # Generate a idempotency key - max 50 chars
            # Use the reference itself as it should be unique per request
            idempotency_key = reference
            
            # Make sure it's not too long
            if len(idempotency_key) > 50:
                idempotency_key = reference[:50]
            
            print(f"Using idempotency key: {idempotency_key} (length: {len(idempotency_key)})")
            
            # Use the access token in the Authorization header
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Merchant-Serial-Number": self.merchant_serial_number,
                "Idempotency-Key": idempotency_key,
                "Vipps-System-Name": self.system_name,
                "Vipps-System-Version": self.system_version,
                "Vipps-System-Plugin-Name": self.plugin_name,
                "Vipps-System-Plugin-Version": self.plugin_version
            }
            
            print(f"Creating payment at: {url}")
            print(f"Payment payload: {json.dumps(payload)}")
            print(f"Using Merchant-Serial-Number: {self.merchant_serial_number}")
            
            response = requests.post(url, headers=headers, json=payload)
            
            print(f"Payment response status code: {response.status_code}")
            if response.status_code != 200 and response.status_code != 201:
                print(f"Payment response content: {response.content}")
                
            response.raise_for_status()
            
            response_data = response.json()
            print(f"Payment response keys: {response_data.keys()}")
            redirect_url = response_data.get("redirectUrl")
            print(f"Redirect URL: {redirect_url}")
            
            return response_data, None, redirect_url
            
        except requests.exceptions.RequestException as e:
            print(f"API Error (ePayment): {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response status: {e.response.status_code}")
                print(f"Response content: {e.response.content}")
            raise Exception(f"Failed to create ePayment session: {str(e)}")

    def _format_phone_number(self, phone):
        """Format phone number to the expected format for MobilePay"""
        if not phone:
            return None
        
        # Remove any spaces, dashes, etc.
        phone = ''.join(c for c in phone if c.isdigit() or c == '+')
        
        # If it starts with 00, replace with +
        if phone.startswith('00'):
            phone = '+' + phone[2:]
        
        # If it doesn't have a country code, add Danish country code
        if not phone.startswith('+'):
            # If it starts with 0, remove the 0
            if phone.startswith('0'):
                phone = phone[1:]
            # Add Danish country code
            if not phone.startswith('45'):
                phone = '45' + phone
            
        # Ensure it's in the expected format
        if phone.startswith('+'):
            return phone
        else:
            return f"+{phone}"

    def get_mobilepay_payment_status(self, payment_id):
        """Get status of a MobilePay payment"""
        url = f"{self.mobilepay_url}/v1/payments/{payment_id}"
        
        headers = {
            "Content-Type": "application/json",
            "x-ibm-client-id": self.client_id,
            "x-api-key": self.subscription_key
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"MobilePay API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response content: {e.response.content}")
            raise Exception(f"Failed to get MobilePay payment status: {str(e)}")

    def get_payment_events(self, reference):
        """Get payment event log from ePayment API"""
        try:
            # First, get an access token
            token_url = f"{self.base_url}/accesstoken/get"
            token_headers = {
                "Content-Type": "application/json",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "Ocp-Apim-Subscription-Key": self.subscription_key
            }
            
            token_response = requests.post(token_url, headers=token_headers)
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise Exception("Failed to obtain access token")
            
            # Now get the payment events with the access token
            url = f"{self.base_url}/epayment/v1/payments/{reference}/events"
            
            print(f"Fetching payment events from: {url}")
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Merchant-Serial-Number": self.merchant_serial_number,
                "Vipps-System-Name": self.system_name,
                "Vipps-System-Version": self.system_version,
                "Vipps-System-Plugin-Name": self.plugin_name,
                "Vipps-System-Plugin-Version": self.plugin_version
            }
            
            response = requests.get(url, headers=headers)
            
            # Log response details for debugging
            print(f"Response status code: {response.status_code}")
            if response.status_code != 200:
                print(f"Response content: {response.content}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response status: {e.response.status_code}")
                print(f"Response content: {e.response.content}")
            
            # Check for common errors and provide better error messages
            if hasattr(e, 'response'):
                if e.response.status_code == 404:
                    error_msg = f"Payment events for reference '{reference}' not found. Verify the reference is correct and exists in the MobilePay system."
                elif e.response.status_code == 401:
                    error_msg = "Authorization failed. Check your API keys and credentials."
                elif e.response.status_code == 403:
                    error_msg = "Access forbidden. Your account may not have permission to access this payment."
                else:
                    error_msg = f"Failed to get payment events: {str(e)}"
                raise Exception(error_msg)
            else:
                raise Exception(f"Failed to get payment events: {str(e)}")

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
    """
    Handle callbacks from Vipps/MobilePay api.
    """
    try:
        # Log the raw callback data for debugging
        body = request.body.decode('utf-8')
        print(f"Received callback data: {body}")
        
        # Parse JSON data
        data = json.loads(body)
        
        # Log the parsed data
        print(f"Parsed callback data: {json.dumps(data, indent=2)}")
        
        # Extract the payment reference
        reference = data.get('reference')
        if not reference:
            return JsonResponse({"error": "No reference provided"}, status=400)
        
        # Log the callback in the database
        PaymentLog.objects.create(
            reference=reference,
            event_type="callback",
            payload=body
        )
        
        # Return success response
        return JsonResponse({"status": "success"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        print(f"Error in callback handler: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
@require_http_methods(["POST"])
def checkout_callback_handler(request):
    """
    Handle callbacks from the checkout process specifically.
    """
    try:
        # Log the raw callback data for debugging
        body = request.body.decode('utf-8')
        print(f"Received checkout callback data: {body}")
        
        # Parse JSON data
        data = json.loads(body)
        
        # Log the parsed data
        print(f"Parsed checkout callback data: {json.dumps(data, indent=2)}")
        
        # Extract the payment reference
        reference = data.get('reference')
        if not reference:
            return JsonResponse({"error": "No reference provided"}, status=400)
        
        # Log the checkout callback in the database
        PaymentLog.objects.create(
            reference=reference,
            event_type="checkout_callback",
            payload=body
        )
        
        # Return success response
        return JsonResponse({"status": "success"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        print(f"Error in checkout callback handler: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

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
    """This page is shown when the user returns from Vipps/MobilePay.
    Also auto-captures the payment if it's in AUTHORIZED state."""
    
    # Extract reference from the request parameters
    reference = request.GET.get('reference')
    order = None
    payment_status = None
    
    # If we have a reference, try to check and auto-capture the payment
    if reference:
        try:
            # Get payment details from the API
            payment_details = api.get_payment_details(reference)
            payment_status = payment_details.get('state', '').upper()
            
            try:
                # Find the corresponding order
                order = Order.objects.get(reference=reference)
                
                # If payment is authorized but not captured yet, auto-capture it
                if payment_status == 'AUTHORIZED':
                    try:
                        print(f"Auto-capturing payment for order {reference} on return URL")
                        
                        # Try different paths to get the authorized amount
                        authorized_amount = None
                        
                        # Check different possible paths for the amount
                        if 'summary' in payment_details and 'authorizedAmount' in payment_details['summary']:
                            if 'value' in payment_details['summary']['authorizedAmount']:
                                authorized_amount = payment_details['summary']['authorizedAmount']['value']
                        
                        if authorized_amount is None and 'amount' in payment_details:
                            if isinstance(payment_details['amount'], dict) and 'value' in payment_details['amount']:
                                authorized_amount = payment_details['amount']['value']
                            elif isinstance(payment_details['amount'], (int, float)):
                                authorized_amount = payment_details['amount']
                        
                        # If we still don't have the amount, try original order amount
                        if authorized_amount is None:
                            authorized_amount = order.amount
                            print(f"Using original order amount: {authorized_amount}")
                        
                        print(f"Found authorized amount: {authorized_amount}")
                        
                        if authorized_amount:
                            # Capture the full authorized amount
                            capture_result = api.capture_payment(
                                reference=reference,
                                amount=authorized_amount,
                                description=f"Auto-captured payment for order {reference} (on return)"
                            )
                            
                            # Log the capture
                            PaymentLog.objects.create(
                                order=order,
                                event_type='PAYMENT_AUTO_CAPTURED',
                                status='COMPLETED',
                                amount=authorized_amount,
                                response_data=capture_result
                            )
                            
                            # Update order status to COMPLETED since we've captured
                            order.status = 'COMPLETED'
                            order.completed_at = datetime.datetime.now()
                            payment_status = 'CAPTURED'  # Update the status for the template
                            print(f"Payment auto-captured successfully for order {reference}")
                        else:
                            print(f"Could not auto-capture: missing authorized amount for order {reference}")
                    except Exception as capture_error:
                        print(f"Failed to auto-capture payment for order {reference}: {str(capture_error)}")
                
                # Update order status based on payment state if we didn't capture
                if payment_status == 'AUTHORIZED' and order.status != 'COMPLETED':
                    order.status = 'PAYMENT_CONFIRMED'
                elif payment_status == 'CAPTURED':
                    order.status = 'COMPLETED'
                    if not order.completed_at:
                        order.completed_at = datetime.datetime.now()
                elif payment_status in ['FAILED', 'CANCELLED', 'TERMINATED']:
                    order.status = 'PAYMENT_FAILED'
                
                order.save()
                
                # Log the payment check
                PaymentLog.objects.create(
                    order=order,
                    event_type='RETURN_URL_STATUS_CHECK',
                    status=payment_status,
                    transaction_id=reference,
                    amount=payment_details.get('summary', {}).get('authorizedAmount', {}).get('value', order.amount),
                    response_data=payment_details
                )
                
            except Order.DoesNotExist:
                print(f"Order not found for reference: {reference}")
                
        except Exception as e:
            print(f"Error getting/processing payment details on return URL: {str(e)}")
    
    # Pass the order and payment status to the template
    context = {
        'order': order,
        'payment_status': payment_status,
        'reference': reference
    }
    
    return render(request, 'checkout_complete.html', context)

@csrf_exempt
@require_http_methods(["POST"])
def create_mobilepay_checkout(request):
    """Create a MobilePay checkout session using the ePayment API"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['amount']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return JsonResponse(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=400
            )

        reference = data.get('reference', f"order-{uuid.uuid4().hex[:8]}")
        
        customer = None
        customer_data = data.get('customer', {})
        customer_phone = None
        
        if customer_data:
            customer_phone = customer_data.get('phone')
            
            if customer_data.get('email'):
                customer, created = Customer.objects.update_or_create(
                    email=customer_data.get('email'),
                    defaults={
                        'first_name': customer_data.get('first_name', ''), # Use snake_case
                        'last_name': customer_data.get('last_name', ''),   # Use snake_case
                        'phone': customer_data.get('phone', ''),
                        'address': customer_data.get('address', ''),
                        'postal_code': customer_data.get('postal_code', ''), # Use snake_case
                        'city': customer_data.get('city', ''),
                        'marketing_consent': customer_data.get('marketing_consent', False), # Use snake_case
                    }
                )
        
        order = Order.objects.create(
            reference=reference,
            customer=customer,
            amount=data['amount'],
            currency=data.get('currency', 'DKK'),
            status='CREATED',
            shipping_method=data.get('shipping_method', 'home'), # Use snake_case
            shipping_cost=data.get('shipping_cost', 4900), # Use snake_case
            payment_method='mobilepay', # Keep as 'mobilepay' internally
            comments=data.get('comments', ''),
            pickup_point_id=data.get('pickupPointId'), # Keep camelCase if frontend sends this
             # Remove callback_token creation here, ePayment doesn't return one this way
        )
        
        items_data = data.get('items', [])
        for item_data in items_data:
             OrderItem.objects.create(
                 order=order,
                 name=item_data.get('name', 'Product'),
                 price=item_data.get('price', 0),
                 quantity=item_data.get('quantity', 1),
                 fabric_type=item_data.get('fabricType'),
                 body_fabric=item_data.get('bodyFabric'),
                 head_fabric=item_data.get('headFabric'),
                 under_arms_fabric=item_data.get('underArmsFabric'),
                 belly_fabric=item_data.get('bellyFabric'),
                 has_vest=item_data.get('hasVest', False),
                 vest_fabric=item_data.get('vestFabric'),
                 face_style=item_data.get('faceStyle'),
             )
        
        PaymentLog.objects.create(
            order=order,
            event_type='CHECKOUT_CREATED',
            status='CREATED',
            response_data={}
        )

        # Create the checkout session using the updated ePayment method
        try:
            # Use the ePayment method which should handle MobilePay
            # Append the reference to the return URL so we can use it for auto-capture
            return_url = data.get('return_url')
            if return_url:
                if "?" in return_url:
                    return_url += f"&reference={reference}"
                else:
                    return_url += f"?reference={reference}"
            
            checkout_data, callback_token, redirect_url = api.create_mobilepay_checkout(
                amount=data['amount'],
                reference=reference,
                description=data.get('description', f"Order {reference}"),
                return_url=return_url,
                callback_url=api.checkout_callback_url, # Use configured callback
                customer_phone=customer_phone
            )

            # Log the successful checkout creation
            PaymentLog.objects.create(
                order=order,
                event_type='EPAYMENT_CHECKOUT_CREATED', # Log as ePayment
                status='SUCCESS',
                response_data=checkout_data
            )

            # Return the checkout information (using ePayment response)
            return JsonResponse({
                'success': True,
                'reference': reference, # The order reference is the key identifier
                'redirectUrl': redirect_url, # Use the redirectUrl from ePayment response
                'status': 'created' 
            })

        except Exception as e:
            PaymentLog.objects.create(
                order=order,
                event_type='EPAYMENT_CHECKOUT_ERROR', # Log as ePayment error
                status='ERROR',
                response_data={'error': str(e)}
            )
            order.status = 'SESSION_FAILED'
            order.save()
            return JsonResponse({
                'success': False,
                'error': str(e),
                'reference': reference
            }, status=500)

    except Exception as e:
         # General error handling
        print(f"General Error in create_mobilepay_checkout: {str(e)}") # Add logging
        import traceback
        traceback.print_exc() # Print stack trace for debugging
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@require_http_methods(["GET"])
def get_mobilepay_payment(request, payment_id):
    """Get status of a MobilePay payment"""
    try:
        # Get the payment details from MobilePay
        payment_details = api.get_mobilepay_payment_status(payment_id)
        
        # Try to find the order in our database
        try:
            order = Order.objects.get(reference=payment_details.get('reference', ''))
            
            # Update order status based on payment status
            payment_state = payment_details.get('state', '').upper()
            if payment_state == 'INITIATED':
                order.status = 'PROCESSING'
            elif payment_state == 'RESERVED':
                order.status = 'PAYMENT_CONFIRMED'
            elif payment_state == 'CAPTURED':
                order.status = 'COMPLETED'
                order.completed_at = datetime.datetime.now()
            elif payment_state == 'REJECTED' or payment_state == 'CANCELLED':
                order.status = 'PAYMENT_FAILED'
                
            order.save()
            
            # Log the payment details
            PaymentLog.objects.create(
                order=order,
                event_type='MOBILEPAY_PAYMENT_STATUS',
                status=payment_state,
                transaction_id=payment_id,
                amount=payment_details.get('amount'),
                response_data=payment_details
            )
            
            return JsonResponse({
                'success': True,
                'order': {
                    'reference': order.reference,
                    'status': order.status,
                    'amount': order.amount,
                    'created_at': order.created_at,
                    'completed_at': order.completed_at
                },
                'payment': payment_details
            })
            
        except Order.DoesNotExist:
            # If order not found, just return the payment details
            return JsonResponse({
                'success': True,
                'payment': payment_details,
                'warning': 'Order not found in database'
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
@require_http_methods(["POST"])
def mobilepay_callback_handler(request):
    """Handle Vipps/MobilePay ePayment webhook callbacks"""
    try:
        # Verify the callback authenticity (IMPORTANT - See Vipps/MobilePay docs for webhook security)
        # Example: Check headers like 'Authorization' if using tokens, or use signature validation

        data = json.loads(request.body)
        
        reference = data.get('reference')
        if not reference:
             print("Webhook Error: Missing reference in callback data")
             return JsonResponse({'error': 'Missing reference'}, status=400)

        # Fetch payment details using the reference to confirm status
        try:
             payment_details = api.get_payment_details(reference)
        except Exception as e:
             print(f"Webhook Error: Failed to get payment details for {reference}: {str(e)}")
             # Decide how to handle: retry later, log, or return error?
             # Returning 500 might cause Vipps/MobilePay to retry the webhook.
             return JsonResponse({'error': 'Failed to verify payment status'}, status=500) 

        try:
            order = Order.objects.get(reference=reference)
            
            # Update order status based on confirmed payment_details state
            payment_state = payment_details.get('state', '').upper()
            # ... (map ePayment states to Order status - same logic as get_payment_status_view) ...
            if payment_state == 'AUTHORIZED':
                order.status = 'PAYMENT_CONFIRMED'
                
                # AUTOMATIC CAPTURE: When payment is authorized, capture it immediately
                try:
                    print(f"Auto-capturing payment for order {reference}")
                    # Try different paths to get the authorized amount from the payment details
                    authorized_amount = None
                    
                    # Print full payment details for debugging
                    print(f"Payment details: {json.dumps(payment_details, indent=2)}")
                    
                    # Check different possible paths for the amount
                    if 'summary' in payment_details and 'authorizedAmount' in payment_details['summary']:
                        if 'value' in payment_details['summary']['authorizedAmount']:
                            authorized_amount = payment_details['summary']['authorizedAmount']['value']
                    
                    if authorized_amount is None and 'amount' in payment_details:
                        if isinstance(payment_details['amount'], dict) and 'value' in payment_details['amount']:
                            authorized_amount = payment_details['amount']['value']
                        elif isinstance(payment_details['amount'], (int, float)):
                            authorized_amount = payment_details['amount']
                    
                    # If we still don't have the amount, try original order amount
                    if authorized_amount is None:
                        authorized_amount = order.amount
                        print(f"Using original order amount: {authorized_amount}")
                    
                    print(f"Found authorized amount: {authorized_amount}")
                    
                    if authorized_amount:
                        # Capture the full authorized amount
                        capture_result = api.capture_payment(
                            reference=reference,
                            amount=authorized_amount,
                            description=f"Auto-captured payment for order {reference}"
                        )
                        
                        # Log the capture
                        PaymentLog.objects.create(
                            order=order,
                            event_type='PAYMENT_AUTO_CAPTURED',
                            status='COMPLETED',
                            amount=authorized_amount,
                            response_data=capture_result
                        )
                        
                        # Update order status to COMPLETED since we've captured
                        order.status = 'COMPLETED'
                        order.completed_at = datetime.datetime.now()
                        print(f"Payment auto-captured successfully for order {reference}")
                    else:
                        print(f"Could not auto-capture: missing authorized amount for order {reference}")
                except Exception as capture_error:
                    print(f"Failed to auto-capture payment for order {reference}: {str(capture_error)}")
                    # If capture fails, keep the payment as PAYMENT_CONFIRMED
                    # You may want to add this error to a queue for manual review
                
            elif payment_state == 'CAPTURED':
                 order.status = 'COMPLETED'
                 order.completed_at = datetime.datetime.now()
            elif payment_state in ['FAILED', 'CANCELLED', 'TERMINATED']:
                 order.status = 'PAYMENT_FAILED'
            # Add other states
            else:
                 order.status = 'PROCESSING' 

            order.save()
            
            PaymentLog.objects.create(
                order=order,
                event_type='EPAYMENT_CALLBACK',
                status=payment_state,
                transaction_id=reference, # Use reference
                amount=payment_details.get('summary', {}).get('authorizedAmount', {}).get('value'),
                response_data=data # Log the raw callback data
            )
            
            # Respond to Vipps/MobilePay that the webhook was received successfully
            return JsonResponse({'success': True}) 
            
        except Order.DoesNotExist:
            print(f"Webhook Error: Order not found for reference: {reference}")
            # Acknowledge receipt even if order not found locally to prevent retries for this event
            return JsonResponse({'warning': 'Order not found locally, but webhook acknowledged'}, status=200) 
            
    except json.JSONDecodeError:
        print("Webhook Error: Invalid JSON received")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Webhook Error: General error processing callback: {str(e)}")
        import traceback
        traceback.print_exc()
        # Acknowledge receipt to prevent retries, but log the error
        return JsonResponse({'error': 'Internal server error processing webhook'}, status=200) 

@require_http_methods(["GET"])
def get_payment_status_view(request, reference):
    """Get status of an ePayment transaction"""
    try:
        payment_details = api.get_payment_details(reference)
        
        try:
            order = Order.objects.get(reference=reference)
            
            # Update order status based on ePayment state
            payment_state = payment_details.get('state', '').upper()
            if payment_state == 'AUTHORIZED':
                order.status = 'PAYMENT_CONFIRMED'
                
                # Auto-capture if payment is authorized but not captured yet
                if order.status != 'COMPLETED':
                    try:
                        print(f"Auto-capturing payment for order {reference} from status check")
                        # Try different paths to get the authorized amount from the payment details
                        authorized_amount = None
                        
                        # Print full payment details for debugging
                        print(f"Payment details: {json.dumps(payment_details, indent=2)}")
                        
                        # Check different possible paths for the amount
                        if 'summary' in payment_details and 'authorizedAmount' in payment_details['summary']:
                            if 'value' in payment_details['summary']['authorizedAmount']:
                                authorized_amount = payment_details['summary']['authorizedAmount']['value']
                        
                        if authorized_amount is None and 'amount' in payment_details:
                            if isinstance(payment_details['amount'], dict) and 'value' in payment_details['amount']:
                                authorized_amount = payment_details['amount']['value']
                            elif isinstance(payment_details['amount'], (int, float)):
                                authorized_amount = payment_details['amount']
                        
                        # If we still don't have the amount, try original order amount
                        if authorized_amount is None:
                            authorized_amount = order.amount
                            print(f"Using original order amount: {authorized_amount}")
                        
                        print(f"Found authorized amount: {authorized_amount}")
                        
                        if authorized_amount:
                            # Capture the full authorized amount
                            capture_result = api.capture_payment(
                                reference=reference,
                                amount=authorized_amount,
                                description=f"Auto-captured payment for order {reference} (status check)"
                            )
                            
                            # Log the capture
                            PaymentLog.objects.create(
                                order=order,
                                event_type='PAYMENT_AUTO_CAPTURED',
                                status='COMPLETED',
                                amount=authorized_amount,
                                response_data=capture_result
                            )
                            
                            # Update order status to COMPLETED since we've captured
                            order.status = 'COMPLETED'
                            order.completed_at = datetime.datetime.now()
                            payment_state = 'CAPTURED'  # Update the state for the response
                            print(f"Payment auto-captured successfully for order {reference}")
                            
                            # Also update payment_details to reflect the capture
                            payment_details['state'] = 'CAPTURED'
                        else:
                            print(f"Could not auto-capture: missing authorized amount for order {reference}")
                    except Exception as capture_error:
                        print(f"Failed to auto-capture payment for order {reference}: {str(capture_error)}")
                
            elif payment_state == 'CAPTURED':
                order.status = 'COMPLETED'
                order.completed_at = datetime.datetime.now()
            elif payment_state in ['FAILED', 'CANCELLED', 'TERMINATED']:
                order.status = 'PAYMENT_FAILED'
            else:
                order.status = 'PROCESSING'
                
            order.save()
            
            PaymentLog.objects.create(
                order=order,
                event_type='EPAYMENT_STATUS_CHECK',
                status=payment_state,
                transaction_id=reference,
                amount=payment_details.get('summary', {}).get('authorizedAmount', {}).get('value'),
                response_data=payment_details
            )
            
            return JsonResponse({
                'success': True,
                'order': {
                    'reference': order.reference,
                    'status': order.status,
                    'amount': order.amount,
                    'created_at': order.created_at,
                    'completed_at': order.completed_at
                },
                'payment': payment_details
            })
            
        except Order.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Order not found'
            }, status=404)
            
    except Exception as e:
        print(f"Error getting ePayment status for {reference}: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

def mobilepay_test_page(request):
    """Serve a simple test page for 1 kr MobilePay payments"""
    return render(request, 'mobilepay_test.html')

# Serve Next.js frontend
index_view = never_cache(TemplateView.as_view(template_name='index.html'))

@csrf_exempt
@require_http_methods(["POST"])
def capture_payment_frontend(request, reference):
    """Endpoint for frontend to trigger payment capture"""
    try:
        data = json.loads(request.body)
        amount = data.get('amount')
        description = data.get('description', f"Captured from frontend for order {reference}")
        
        if not amount:
            return JsonResponse({
                'success': False,
                'error': 'Missing amount parameter'
            }, status=400)
        
        # Log that capture attempt is being made from frontend
        print(f"Frontend attempting to capture payment for reference: {reference}, amount: {amount}")
        
        # Try to find the order to log the capture attempt
        try:
            order = Order.objects.get(reference=reference)
            PaymentLog.objects.create(
                order=order,
                event_type='FRONTEND_CAPTURE_ATTEMPT',
                status='INITIATED',
                amount=amount,
                response_data={'description': description}
            )
        except Order.DoesNotExist:
            # If order doesn't exist locally, still try to capture but log warning
            print(f"Warning: Order {reference} not found in database but attempting capture anyway")
        
        # Attempt the capture
        result = api.capture_payment(
            reference=reference,
            amount=amount,
            description=description
        )
        
        # Log the successful capture
        if order:
            PaymentLog.objects.create(
                order=order,
                event_type='FRONTEND_CAPTURE_SUCCESS',
                status='COMPLETED',
                amount=amount,
                response_data=result
            )
            
            # Update order status
            order.status = 'COMPLETED'
            order.completed_at = datetime.datetime.now()
            order.save()
        
        return JsonResponse({
            'success': True,
            'data': result
        })
            
    except Exception as e:
        print(f"Error in frontend capture: {str(e)}")
        # Try to log the error if we can find the order
        try:
            order = Order.objects.get(reference=reference)
            PaymentLog.objects.create(
                order=order,
                event_type='FRONTEND_CAPTURE_ERROR',
                status='ERROR',
                response_data={'error': str(e)}
            )
        except Exception:
            # If we can't log to the order, just continue
            pass
            
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@require_http_methods(["GET"])
def get_payment_events_view(request, reference):
    """Get event log for an ePayment transaction"""
    try:
        events = api.get_payment_events(reference)
        
        try:
            order = Order.objects.get(reference=reference)
            
            # Log the event log request
            PaymentLog.objects.create(
                order=order,
                event_type='EPAYMENT_EVENTS_CHECK',
                status='SUCCESS',
                transaction_id=reference,
                response_data=events
            )
            
            return JsonResponse({
                'success': True,
                'order': {
                    'reference': order.reference,
                    'status': order.status,
                },
                'events': events
            })
            
        except Order.DoesNotExist:
            # Even if we can't find the order, still return the events
            return JsonResponse({
                'success': True,
                'order': None,
                'events': events
            })
            
    except Exception as e:
        print(f"Error getting ePayment events for {reference}: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
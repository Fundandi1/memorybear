from django.urls import path, include
from django.contrib import admin
from .views import (
    create_checkout,
    get_checkout_session,
    get_payment,
    callback_handler,
    capture_payment_view,
    refund_payment_view,
    cancel_payment_view,
    create_mobilepay_checkout,
    get_mobilepay_payment,
    mobilepay_callback_handler,
    get_payment_status_view,
    mobilepay_test_page,
    capture_payment_frontend,
    get_payment_events_view,
    index_view,
    checkout_callback_handler,
    checkout_complete,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    path('', index_view, name='index'),
    
    # API endpoints
    path('api/', include('api.urls')),
    
    # Checkout endpoints
    path('checkout/', create_checkout, name='create_checkout'),
    path('checkout/session/<str:reference>/', get_checkout_session, name='get_checkout_session'),
    path('checkout/payment/<str:reference>/', get_payment, name='get_payment'),
    path('checkout/callback/', callback_handler, name='callback_handler'),
    path('checkout/capture/<str:reference>/', capture_payment_view, name='capture_payment'),
    path('checkout/refund/<str:reference>/', refund_payment_view, name='refund_payment'),
    path('checkout/cancel/<str:reference>/', cancel_payment_view, name='cancel_payment'),
    
    # MobilePay-specific endpoints (now using ePayment)
    path('mobilepay/checkout/', create_mobilepay_checkout, name='create_mobilepay_checkout'),
    path('epayment/status/<str:reference>/', get_payment_status_view, name='get_payment_status'),
    path('epayment/events/<str:reference>/', get_payment_events_view, name='get_payment_events'),
    
    # MobilePay callbacks
    path('mobilepay/callback/', mobilepay_callback_handler, name='mobilepay_callback_handler'),
    
    # Checkout callbacks
    path('checkout/callback/', checkout_callback_handler, name='checkout_callback_handler'),
    
    # Checkout completion
    path('checkout/complete/', checkout_complete, name='checkout_complete'),
    
    # MobilePay test page
    path('mobilepay/test/', mobilepay_test_page, name='mobilepay_test_page'),
    
    # Frontend capture endpoint
    path('payments/<str:reference>/capture/', capture_payment_frontend, name='capture_payment_frontend'),
]
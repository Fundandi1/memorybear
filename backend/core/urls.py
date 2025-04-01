
from django.urls import path
from .views import (
    create_checkout,
    get_checkout_session,
    get_payment,
    callback_handler,
    capture_payment_view,
    refund_payment_view,
    cancel_payment_view,
)

urlpatterns = [
    # Checkout endpoints
    path('checkout/', create_checkout, name='create_checkout'),
    path('checkout/session/<str:reference>/', get_checkout_session, name='get_checkout_session'),
    path('checkout/payment/<str:reference>/', get_payment, name='get_payment'),
    path('checkout/callback/', callback_handler, name='callback_handler'),
    path('checkout/capture/<str:reference>/', capture_payment_view, name='capture_payment'),
    path('checkout/refund/<str:reference>/', refund_payment_view, name='refund_payment'),
    path('checkout/cancel/<str:reference>/', cancel_payment_view, name='cancel_payment'),
]
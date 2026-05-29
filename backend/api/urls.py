from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet)
router.register('products', views.ProductViewSet)
router.register('customers', views.CustomerViewSet)
router.register('orders', views.OrderViewSet)
router.register('categories', views.CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/', views.LoginView.as_view()),
    path('auth/verify/<uuid:token>/', views.verify_email),
    path('profile/', views.ProfileView.as_view()),
    path('dashboard/stats/', views.dashboard_stats),
    path('track/<str:ticket>/', views.track_order),
    path('chatbot/', views.chatbot),
]

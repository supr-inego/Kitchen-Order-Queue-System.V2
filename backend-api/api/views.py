from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .models import Product, Customer, Order, OrderItem, Category
from .serializers import *
import logging
import requests, json

User = get_user_model()
logger = logging.getLogger(__name__)

def persist_uploaded_image(instance, field_name, upload):
    if not upload:
        return
    upload.seek(0)
    setattr(instance, f'{field_name}_data', upload.read())
    setattr(instance, f'{field_name}_content_type', upload.content_type or 'image/jpeg')
    instance.save(update_fields=[f'{field_name}_data', f'{field_name}_content_type'])

def send_verification_email(user, link):
    subject = 'Verify your Kitchen POS account'
    text = f'Hi {user.first_name},\n\nClick to verify: {link}'
    html = (
        f'<p>Hi {user.first_name},</p>'
        f'<p>Click this link to verify your Kitchen POS account:</p>'
        f'<p><a href="{link}">{link}</a></p>'
    )

    if settings.RESEND_API_KEY:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {settings.RESEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'from': settings.RESEND_FROM_EMAIL,
                'to': [user.email],
                'subject': subject,
                'html': html,
                'text': text,
            },
            timeout=settings.EMAIL_TIMEOUT,
        )
        response.raise_for_status()
        return

    send_mail(
        subject,
        text,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

# --- Custom JWT ---
class MyTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get(self.username_field)
        password = attrs.get('password')
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            raise AuthenticationFailed('No email found')
        if not user.check_password(password):
            raise AuthenticationFailed('Wrong password')
        if not user.is_active:
            raise AuthenticationFailed('This account is inactive.')

        data = super().validate(attrs)
        if not self.user.is_verified:
            raise AuthenticationFailed('Please verify your email before signing in. Check your inbox for the confirmation link.')
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['name'] = f"{user.first_name} {user.last_name}"
        token['email'] = user.email
        return token

class LoginView(TokenObtainPairView):
    serializer_class = MyTokenSerializer

# --- Auth ---
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        Customer.objects.get_or_create(
            email=user.email,
            defaults={
                'name': f'{user.first_name} {user.last_name}'.strip(),
                'phone': user.phone,
            }
        )
        token = user.verification_token
        link = f"{settings.FRONTEND_URL}/verify/{token}"
        email_sent = True
        try:
            send_verification_email(user, link)
        except Exception:
            email_sent = False
            logger.exception('Verification email failed for %s', user.email)

        print(f"\n[EMAIL] Verification link for {user.email}: {link}\n")
        data = {
            'message': 'Account created. Please verify your email before signing in.',
            'email': user.email,
            'email_sent': email_sent,
        }
        if not email_sent:
            data['message'] = 'Account created, but the verification email could not be sent.'
            data['verification_url'] = link

        headers = self.get_success_headers(serializer.data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_email(request, token):
    try:
        user = User.objects.get(verification_token=token)
        user.is_verified = True
        user.save()
        return Response({'message': 'Email verified successfully'})
    except User.DoesNotExist:
        return Response({'error': 'Invalid token'}, status=400)

# --- Profile ---
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        persist_uploaded_image(user, 'avatar', self.request.FILES.get('avatar'))

# --- Admin: Users ---
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['admin', 'staff']

class IsAuthenticatedCustomerOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['patch'])
    def set_role(self, request, pk=None):
        user = self.get_object()
        role = request.data.get('role')
        if role not in ['admin','staff','customer']:
            return Response({'error': 'Invalid role'}, status=400)
        user.role = role
        user.save()
        return Response({'message': f'Role updated to {role}'})

# --- Products ---
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list','retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsStaffOrAdmin()]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list','retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsStaffOrAdmin()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        product = serializer.save()
        persist_uploaded_image(product, 'image', self.request.FILES.get('image'))

    def perform_update(self, serializer):
        product = serializer.save()
        persist_uploaded_image(product, 'image', self.request.FILES.get('image'))

# --- Customers ---
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        for user in User.objects.filter(role='customer'):
            customer, created = Customer.objects.get_or_create(
                email=user.email,
                defaults={
                    'name': f'{user.first_name} {user.last_name}'.strip(),
                    'phone': user.phone,
                }
            )
            if not created:
                next_name = f'{user.first_name} {user.last_name}'.strip()
                changed = False
                if next_name and customer.name != next_name:
                    customer.name = next_name
                    changed = True
                if user.phone and customer.phone != user.phone:
                    customer.phone = user.phone
                    changed = True
                if changed:
                    customer.save()
        return Customer.objects.all().order_by('-created_at')

# --- Orders ---
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related('customer','staff').prefetch_related('items__product')
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [IsAuthenticatedCustomerOrStaff()]
        return [IsStaffOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'customer':
            qs = qs.filter(customer__email=self.request.user.email)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role == 'customer':
            customer, _ = Customer.objects.get_or_create(
                email=self.request.user.email,
                defaults={
                    'name': f'{self.request.user.first_name} {self.request.user.last_name}'.strip(),
                    'phone': self.request.user.phone,
                }
            )
            if not customer.name:
                customer.name = f'{self.request.user.first_name} {self.request.user.last_name}'.strip()
            customer.phone = self.request.user.phone or customer.phone
            customer.save()
            serializer.save(customer=customer, staff=None)
        else:
            serializer.save(staff=self.request.user)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        valid = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'error': 'Invalid status'}, status=400)
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def track_order(request, ticket):
    try:
        order = Order.objects.prefetch_related('items__product').select_related('customer').get(ticket_number=ticket)
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

# --- Dashboard ---
@api_view(['GET'])
@permission_classes([IsStaffOrAdmin])
def dashboard_stats(request):
    from django.db.models import Count, Sum
    from django.utils import timezone
    today = timezone.now().date()
    orders_today = Order.objects.filter(created_at__date=today)
    return Response({
        'total_orders': Order.objects.count(),
        'orders_today': orders_today.count(),
        'revenue_today': float(orders_today.filter(status='completed').aggregate(s=Sum('total'))['s'] or 0),
        'by_status': {s: Order.objects.filter(status=s).count() for s, _ in Order.STATUS_CHOICES},
        'total_products': Product.objects.count(),
        'total_customers': Customer.objects.count(),
    })

# --- Ollama Chatbot ---
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def chatbot(request):
    message = request.data.get('message','').strip()
    if not message:
        return Response({'error': 'No message'}, status=400)

    # Build context
    pending = Order.objects.filter(status__in=['pending','preparing']).count()
    ready = Order.objects.filter(status='ready').count()

    # Ticket lookup
    ticket_query = None
    words = message.lower().split()
    for w in words:
        if w.isdigit() and len(w) == 4:
            ticket_query = w
            break

    order_context = ""
    if ticket_query:
        try:
            o = Order.objects.prefetch_related('items__product').select_related('customer').get(ticket_number=ticket_query)
            items_str = ', '.join([f"{i.quantity}x {i.product.name}" for i in o.items.all()])
            order_context = f"\nFor ticket #{ticket_query}: customer={o.customer.name if o.customer else 'N/A'}, status={o.status}, items={items_str}, total=₱{o.total}"
        except Order.DoesNotExist:
            order_context = f"\nTicket #{ticket_query} not found."

    system_prompt = f"""You are KitchenBot, a helpful assistant for a kitchen order management system.
Current stats: {pending} orders pending/preparing, {ready} orders ready for pickup.{order_context}
Be concise, friendly, and helpful. Answer questions about orders, menu, and kitchen operations.
If asked about a specific ticket and you have the data, give the full details."""

    try:
        resp = requests.post(
            'http://localhost:11434/api/generate',
            json={'model':'llama3.2','prompt': f"{system_prompt}\n\nUser: {message}\nKitchenBot:","stream":False},
            timeout=30
        )
        if resp.status_code == 200:
            reply = resp.json().get('response','').strip()
            return Response({'reply': reply})
        else:
            return Response({'reply': f"I'm having trouble connecting to the AI model right now. There are currently {pending} orders in the queue and {ready} ready for pickup. How else can I help?"})
    except requests.exceptions.ConnectionError:
        return Response({'reply': f"AI model offline (start Ollama). Currently: {pending} orders in queue, {ready} ready. Ask me about a specific ticket number!"})
    except Exception as e:
        return Response({'reply': f"Sorry, something went wrong: {str(e)}"})

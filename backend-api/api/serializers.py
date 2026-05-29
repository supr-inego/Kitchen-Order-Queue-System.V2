from rest_framework import serializers
from .models import User, Product, Customer, Order, OrderItem, Category
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email','first_name','last_name','password','password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id','email','first_name','last_name','full_name','role','avatar','avatar_url','phone','is_verified','created_at']
        read_only_fields = ['id','email','role','is_verified','created_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

class CustomerSerializer(serializers.ModelSerializer):
    account_id = serializers.SerializerMethodField()
    account_role = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'created_at', 'account_id', 'account_role', 'is_verified']

    def get_account(self, obj):
        if not obj.email:
            return None
        return User.objects.filter(email=obj.email).first()

    def get_account_id(self, obj):
        account = self.get_account(obj)
        return account.id if account else None

    def get_account_role(self, obj):
        account = self.get_account(obj)
        return account.role if account else 'walk-in'

    def get_is_verified(self, obj):
        account = self.get_account(obj)
        return account.is_verified if account else None

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = OrderItem
        fields = ['id','product','product_name','quantity','price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    staff_name = serializers.SerializerMethodField()
    items_data = serializers.ListField(write_only=True, required=False)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['ticket_number','total','created_at','updated_at']

    def get_staff_name(self, obj):
        if obj.staff:
            return f"{obj.staff.first_name} {obj.staff.last_name}"
        return None

    def create(self, validated_data):
        items_data = validated_data.pop('items_data', [])
        order = Order.objects.create(**validated_data)
        total = 0
        for item in items_data:
            product = Product.objects.get(id=item['product_id'])
            qty = item.get('quantity', 1)
            OrderItem.objects.create(order=order, product=product, quantity=qty, price=product.price)
            total += product.price * qty
        order.total = total
        order.save()
        return order

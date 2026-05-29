import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Category, Product, Customer, Order, OrderItem

# Admin
if not User.objects.filter(email='admin@kitchen.com').exists():
    User.objects.create_superuser(email='admin@kitchen.com', password='admin123', first_name='Admin', last_name='User')
if not User.objects.filter(email='staff@kitchen.com').exists():
    u = User.objects.create_user(email='staff@kitchen.com', password='staff123', first_name='Maria', last_name='Santos', role='staff', is_verified=True)

cats = {}
for c in ['Mains','Sides','Drinks','Desserts']:
    cats[c], _ = Category.objects.get_or_create(name=c)

menu = [
    ('Chicken Adobo', 'Classic Filipino chicken adobo', 180, 'Mains'),
    ('Pork Sinigang', 'Sour tamarind pork soup', 220, 'Mains'),
    ('Beef Caldereta', 'Rich tomato-based beef stew', 250, 'Mains'),
    ('Pancit Canton', 'Stir-fried egg noodles', 150, 'Mains'),
    ('Fried Rice', 'Garlic fried rice', 60, 'Sides'),
    ('Steamed Rice', 'Plain steamed rice', 40, 'Sides'),
    ('Lumpia Shanghai', 'Crispy spring rolls (6pcs)', 90, 'Sides'),
    ('Iced Tea', 'Sweetened iced tea', 50, 'Drinks'),
    ('Soft Drink', 'Coke/Sprite/Royal', 45, 'Drinks'),
    ('Buko Pandan', 'Coconut pandan jelly', 80, 'Desserts'),
]
prods = {}
for name, desc, price, cat in menu:
    p, _ = Product.objects.get_or_create(name=name, defaults={'description':desc,'price':price,'category':cats[cat]})
    prods[name] = p

customers_data = [
    ('Juan dela Cruz','juan@email.com','09171234567'),
    ('Maria Reyes','maria@email.com','09281234567'),
    ('Pedro Santos','pedro@email.com','09391234567'),
]
custs = []
for name, email, phone in customers_data:
    c, _ = Customer.objects.get_or_create(name=name, defaults={'email':email,'phone':phone})
    custs.append(c)

staff = User.objects.get(email='staff@kitchen.com')
sample_orders = [
    (custs[0], [('Chicken Adobo',1),('Steamed Rice',2),('Iced Tea',2)], 'preparing'),
    (custs[1], [('Pork Sinigang',1),('Fried Rice',1),('Soft Drink',1)], 'ready'),
    (custs[2], [('Beef Caldereta',2),('Lumpia Shanghai',1)], 'pending'),
]
for cust, items, st in sample_orders:
    if not Order.objects.filter(customer=cust, status=st).exists():
        o = Order.objects.create(customer=cust, staff=staff, status=st)
        total = 0
        for pname, qty in items:
            p = prods[pname]
            OrderItem.objects.create(order=o, product=p, quantity=qty, price=p.price)
            total += p.price * qty
        o.total = total
        o.save()

print("Seed complete!")
print("Admin: admin@kitchen.com / admin123")
print("Staff: staff@kitchen.com / staff123")

from __future__ import annotations

import hashlib
from collections.abc import Iterable

from app.settings import settings
from app.supabase_store import SupabaseStore


def _hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"{salt}${digest.hex()}"


def make_password(password: str, salt: str) -> str:
    return _hash_password(password, salt)


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, hash_hex = stored.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return digest == hash_hex


PRODUCT_SEED = [
    {
        "slug": "cucumber-face-wash",
        "name": "Cucumber Face Wash",
        "kicker": "Vitamin C + Niacinamide",
        "claim": "A fresh start, bottled.",
        "intro": "A cooling daily cleanse that lifts away excess oil and city grime while keeping skin comfortable, soft and visibly refreshed.",
        "price": 349,
        "mrp": 449,
        "image": "/products/cucumber.jpg",
        "tone": "#e9f7c9",
        "accent": "#3c8b28",
        "tag": "FRESH START",
        "rating": "4.8",
        "category": "Face Wash",
        "ingredients": ["Cucumber extract", "Niacinamide", "Allantoin", "Licorice root"],
        "benefits": [
            "Gently cleanses without over-drying",
            "Supports a brighter-looking complexion",
            "Leaves skin cool, calm and refreshed",
        ],
        "stock": 98,
    },
    {
        "slug": "mango-sunscreen",
        "name": "Mango Sunscreen SPF 50",
        "kicker": "PA++++ Broad Spectrum",
        "claim": "Sun care with main-character energy.",
        "intro": "Lightweight, non-greasy daily SPF with broad-spectrum UVA and UVB protection, designed to disappear into every morning ritual.",
        "price": 499,
        "mrp": 649,
        "image": "/products/sunscreen.jpg",
        "tone": "#fff0ad",
        "accent": "#e67600",
        "tag": "DAILY DEFENCE",
        "rating": "4.9",
        "category": "Sunscreen",
        "ingredients": ["Niacinamide", "3-O-Ethyl Ascorbic Acid", "Allantoin", "Mango extract"],
        "benefits": [
            "Broad spectrum SPF 50 PA++++",
            "Comfortable, no-heavy-feel finish",
            "Supports an even, radiant look",
        ],
        "stock": 74,
    },
    {
        "slug": "orange-moisturizer",
        "name": "Orange Moisturizer",
        "kicker": "Niacinamide + Glycerin",
        "claim": "Soft skin. Bright mood.",
        "intro": "A silky, lightweight moisturizer that replenishes daily hydration and leaves skin smooth, supple and naturally luminous.",
        "price": 449,
        "mrp": 549,
        "image": "/products/moisturizer.jpg",
        "tone": "#ffe6d0",
        "accent": "#eb6200",
        "tag": "DEEP HYDRATION",
        "rating": "4.7",
        "category": "Moisturizer",
        "ingredients": ["Orange extract", "Glycerin", "Niacinamide", "Allantoin"],
        "benefits": [
            "Long-lasting daily hydration",
            "Lightweight, fast-absorbing comfort",
            "Supports a healthy skin barrier",
        ],
        "stock": 86,
    },
    {
        "slug": "strawberry-serum",
        "name": "Strawberry Face Serum",
        "kicker": "Salicylic Acid + Niacinamide",
        "claim": "A few drops. A clearer rhythm.",
        "intro": "A multi-active serum for texture, pores and uneven-looking skin with a fresh sensorial finish that slips effortlessly into your routine.",
        "price": 549,
        "mrp": 699,
        "image": "/products/serum.jpg",
        "tone": "#ffe3eb",
        "accent": "#ed1f52",
        "tag": "RADIANCE",
        "rating": "4.9",
        "category": "Serum",
        "ingredients": ["Salicylic acid", "Niacinamide", "Alpha arbutin", "Licorice extract"],
        "benefits": [
            "Helps reduce excess oil",
            "Gently unclogs the look of pores",
            "Supports smoother, brighter-looking skin",
        ],
        "stock": 63,
    },
    {
        "slug": "watermelon-face-wash",
        "name": "Watermelon Face Wash",
        "kicker": "AHA · BHA · PHA",
        "claim": "Clean pores. Juicy glow.",
        "intro": "A daily exfoliating face wash made to balance excess oil, refresh clogged-feeling skin and reveal a smoother-looking finish.",
        "price": 379,
        "mrp": 499,
        "image": "/products/watermelon.jpg",
        "tone": "#ffdfe1",
        "accent": "#e81432",
        "tag": "OIL CONTROL",
        "rating": "4.8",
        "category": "Face Wash",
        "ingredients": ["Watermelon extract", "Salicylic acid", "Niacinamide", "Allantoin"],
        "benefits": [
            "Controls excess oil",
            "Gently exfoliates dead surface cells",
            "Soothes redness and discomfort",
        ],
        "stock": 52,
    },
]


ORDER_SEED = [
    ("INON1048", "Packed", 1397, 3, "Wednesday, 20 August", ["cucumber-face-wash", "strawberry-serum", "mango-sunscreen"]),
    ("INON1047", "Paid", 998, 2, "Thursday, 21 August", ["mango-sunscreen", "orange-moisturizer"]),
    ("INON1046", "Shipped", 1846, 4, "Friday, 22 August", ["cucumber-face-wash", "strawberry-serum", "watermelon-face-wash", "orange-moisturizer"]),
    ("INON1045", "Delivered", 549, 1, "Tuesday, 19 August", ["strawberry-serum"]),
]


def _as_list(values: Iterable[str]) -> list[str]:
    return list(values)


def _ensure_auth_user(store: SupabaseStore, email: str, password: str) -> None:
    users = store.auth_admin_list_users()
    existing = next((user for user in users if str(user.get("email", "")).lower() == email.lower()), None)
    if existing and existing.get("id"):
        store.auth_admin_update_user(str(existing["id"]), password=password, email_confirm=True)
        return
    store.auth_admin_create_user(email, password, email_confirm=True)


def seed_database(store: SupabaseStore) -> None:
    try:
        store.create_storage_bucket("products", "products", public=True)
    except Exception:
        # The bucket is already provisioned through SQL during setup.
        pass

    _ensure_auth_user(store, settings.seed_admin_email, settings.seed_admin_password)
    if not store.select("products", limit=1):
        store.insert("products", PRODUCT_SEED)

    admin_profile = store.select("users", filters=[("email", f"eq.{settings.seed_admin_email}")], limit=1)
    if not admin_profile:
        store.insert(
            "users",
            {
                "email": settings.seed_admin_email,
                "password_hash": make_password(settings.seed_admin_password, f"inon::{settings.seed_admin_email}"),
                "first_name": "Ananya",
                "last_name": "Sharma",
                "role": "admin",
                "phone": "+91 98765 43210",
                "city": "New Delhi",
                "glow_points": 0,
            },
        )

    _ensure_auth_user(store, settings.seed_customer_email, settings.seed_customer_password)
    customer_profile = store.select("users", filters=[("email", f"eq.{settings.seed_customer_email}")], limit=1)
    if not customer_profile:
        store.insert(
            "users",
            {
                "email": settings.seed_customer_email,
                "password_hash": make_password(settings.seed_customer_password, f"inon::{settings.seed_customer_email}"),
                "first_name": "Ananya",
                "last_name": "Sharma",
                "role": "customer",
                "phone": "+91 98765 43210",
                "city": "New Delhi",
                "glow_points": 840,
            },
        )

    if store.select("orders", limit=1):
        return

    all_products = {product["slug"]: product for product in store.select("products", order="id.asc")}
    customer_row = store.select("users", filters=[("email", f"eq.{settings.seed_customer_email}")], limit=1)[0]

    order_rows = []
    for number, status, total, item_count, eta, slugs in ORDER_SEED:
        order_rows.append(
            {
                "number": number,
                "customer_id": customer_row["id"],
                "customer_name": f"{customer_row['first_name']} {customer_row['last_name']}",
                "customer_email": customer_row["email"],
                "status": status,
                "total": total,
                "item_count": item_count,
                "shipping_eta": eta,
            }
        )

    inserted_orders = store.insert("orders", order_rows)
    order_item_rows = []
    for order_row, (_, _, _, _, _, slugs) in zip(inserted_orders, ORDER_SEED):
        for slug in _as_list(slugs):
            product = all_products[slug]
            order_item_rows.append(
                {
                    "order_id": order_row["id"],
                    "product_slug": product["slug"],
                    "product_name": product["name"],
                    "price": product["price"],
                    "quantity": 1,
                }
            )
    if order_item_rows:
        store.insert("order_items", order_item_rows)

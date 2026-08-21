from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    AccountOverview,
    AddressRead,
    AddressWrite,
    AdminOverview,
    AdminProductSummary,
    AdminSpark,
    AuthSession,
    CheckoutRequest,
    CouponValidate,
    CmsRead,
    CmsWrite,
    CustomerUpdate,
    DiscountRead,
    DiscountWrite,
    LoginRequest,
    OrderItemRead,
    OrderRead,
    OrderStatusUpdate,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    ProfileUpdate,
    SignupRequest,
    SiteStats,
    UserRead,
    WishlistWrite,
)
from app.seed import PRODUCT_SEED, make_password, seed_database, verify_password
from app.settings import settings
from app.supabase_store import SupabaseStore


def _require_supabase() -> SupabaseStore:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return SupabaseStore(
        settings.supabase_url,
        settings.supabase_service_role_key,
        settings.supabase_publishable_key or None,
    )


store = _require_supabase()


app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _as_product(row: dict[str, Any]) -> ProductRead:
    return ProductRead.model_validate(row)


def _as_user(row: dict[str, Any]) -> UserRead:
    fields = ["first_name", "last_name", "email", "phone", "city", "avatar_url", "skin_type", "skin_concerns"]
    complete = sum(bool(row.get(field)) for field in fields)
    return UserRead.model_validate({**row, "profile_completion_percent": round(complete / len(fields) * 100)})


def _read_order(order: dict[str, Any]) -> dict[str, Any]:
    row = dict(order)
    items = row.pop("order_items", []) or row.pop("items", []) or []
    return {
        "number": row["number"],
        "customer_name": row["customer_name"],
        "customer_email": row["customer_email"],
        "status": row["status"],
        "total": row["total"],
        "item_count": row["item_count"],
        "shipping_eta": row["shipping_eta"],
        "items": [OrderItemRead.model_validate(item) for item in items],
    }


def _bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization token")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization token")
    return token


def _profile_for_token(token: str) -> dict[str, Any]:
    try:
        auth_user = store.auth_user(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session") from exc
    email = str(auth_user.get("email", "")).lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session missing email")
    profile = store.select("users", filters=[("email", f"eq.{email}")], limit=1)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile[0]


def _require_admin(profile: dict[str, Any]) -> None:
    if str(profile.get("role", "")).lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@app.on_event("startup")
def startup() -> None:
    seed_database(store)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "inon-api", "environment": settings.environment}


@app.get("/api/site/stats", response_model=SiteStats)
def site_stats() -> SiteStats:
    return SiteStats(customer_love="4.8/5", formulas=len(PRODUCT_SEED), joy_score="100%")


@app.post("/api/auth/login", response_model=AuthSession)
def login(payload: LoginRequest) -> AuthSession:
    auth = store.auth_password_login(payload.email, payload.password)
    token = auth.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    profile = _profile_for_token(token)
    return AuthSession(
        access_token=auth["access_token"],
        refresh_token=auth.get("refresh_token", ""),
        token_type=auth.get("token_type", "bearer"),
        expires_in=auth.get("expires_in"),
        user=_as_user(profile),
    )


@app.post("/api/auth/signup", response_model=AuthSession)
def signup(payload: SignupRequest) -> AuthSession:
    existing = store.select("users", filters=[("email", f"eq.{payload.email}")], limit=1)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    try:
        store.auth_admin_create_user(payload.email, payload.password, email_confirm=True)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unable to create auth user") from exc

    created = store.insert(
        "users",
        {
            "email": payload.email,
            "password_hash": make_password(payload.password, f"inon::{payload.email}"),
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "role": "customer",
            "phone": payload.phone,
            "city": "New Delhi",
            "glow_points": 120,
        },
    )
    profile = _as_user(created[0])
    auth = store.auth_password_login(payload.email, payload.password)
    return AuthSession(
        access_token=auth["access_token"],
        refresh_token=auth.get("refresh_token", ""),
        token_type=auth.get("token_type", "bearer"),
        expires_in=auth.get("expires_in"),
        user=profile,
    )


@app.get("/api/auth/me", response_model=UserRead)
def me(authorization: str | None = Header(default=None)) -> UserRead:
    token = _bearer_token(authorization)
    return _as_user(_profile_for_token(token))


@app.get("/api/products", response_model=list[ProductRead])
def list_products() -> list[ProductRead]:
    return [_as_product(product) for product in store.select("products", order="id.asc")]


@app.get("/api/products/{slug}", response_model=ProductRead)
def get_product(slug: str) -> ProductRead:
    product = store.select("products", filters=[("slug", f"eq.{slug}")], limit=1)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _as_product(product[0])


@app.get("/api/account/dashboard", response_model=AccountOverview)
def account_dashboard(
    authorization: str | None = Header(default=None),
) -> AccountOverview:
    profile = _profile_for_token(_bearer_token(authorization))
    account_email = str(profile["email"])

    orders = store.select(
        "orders",
        filters=[("customer_email", f"eq.{account_email}")],
        select="*,order_items(*)",
        order="id.desc",
    )
    products = store.select("products", order="id.asc")
    active_order = next((order for order in orders if str(order["status"]).lower() != "delivered"), None)
    return AccountOverview(
        profile=_as_user(profile),
        active_order=_read_order(active_order) if active_order else None,
        recent_orders=[_read_order(order) for order in orders[:4]],
        saved_products=[_as_product(product) for product in products[1:4]],
        am_routine=[_as_product(product) for product in products[:3]],
    )


@app.get("/api/account/wishlist", response_model=list[ProductRead])
def account_wishlist(authorization: str | None = Header(default=None)) -> list[ProductRead]:
    profile = _profile_for_token(_bearer_token(authorization))
    rows = store.select("wishlists", filters=[("user_id", f"eq.{profile['id']}")], order="created_at.desc")
    products: list[ProductRead] = []
    for row in rows:
        match = store.select("products", filters=[("slug", f"eq.{row['product_slug']}")], limit=1)
        if match:
            products.append(_as_product(match[0]))
    return products


@app.get("/api/account/profile", response_model=UserRead)
def account_profile(authorization: str | None = Header(default=None)) -> UserRead:
    return _as_user(_profile_for_token(_bearer_token(authorization)))


@app.patch("/api/account/profile", response_model=UserRead)
def update_account_profile(payload: ProfileUpdate, authorization: str | None = Header(default=None)) -> UserRead:
    token = _bearer_token(authorization)
    profile = _profile_for_token(token)
    data = payload.model_dump(exclude_unset=True, exclude={"role"})
    if "email" in data and data["email"] != profile["email"]:
        auth_user = store.auth_user(token)
        store.auth_admin_update_user(str(auth_user["id"]), email=data["email"], email_confirm=True)
    updated = store.update("users", filters=[("id", f"eq.{profile['id']}")], payload=data)
    return _as_user(updated[0] if updated else {**profile, **data})


@app.get("/api/account/addresses", response_model=list[AddressRead])
def account_addresses(authorization: str | None = Header(default=None)) -> list[AddressRead]:
    profile = _profile_for_token(_bearer_token(authorization))
    return [AddressRead.model_validate(row) for row in store.select("addresses", filters=[("user_id", f"eq.{profile['id']}")], order="is_default.desc,created_at.desc")]


@app.post("/api/account/addresses", response_model=AddressRead)
def create_account_address(payload: AddressWrite, authorization: str | None = Header(default=None)) -> AddressRead:
    profile = _profile_for_token(_bearer_token(authorization))
    if payload.is_default:
        store.update("addresses", filters=[("user_id", f"eq.{profile['id']}")], payload={"is_default": False})
    rows = store.insert("addresses", {**payload.model_dump(), "user_id": profile["id"]})
    return AddressRead.model_validate(rows[0])


@app.patch("/api/account/addresses/{address_id}", response_model=AddressRead)
def update_account_address(address_id: int, payload: AddressWrite, authorization: str | None = Header(default=None)) -> AddressRead:
    profile = _profile_for_token(_bearer_token(authorization))
    if payload.is_default:
        store.update("addresses", filters=[("user_id", f"eq.{profile['id']}")], payload={"is_default": False})
    rows = store.update("addresses", filters=[("id", f"eq.{address_id}"), ("user_id", f"eq.{profile['id']}")], payload=payload.model_dump())
    if not rows:
        raise HTTPException(status_code=404, detail="Address not found")
    return AddressRead.model_validate(rows[0])


@app.delete("/api/account/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account_address(address_id: int, authorization: str | None = Header(default=None)) -> Response:
    profile = _profile_for_token(_bearer_token(authorization))
    store.delete("addresses", filters=[("id", f"eq.{address_id}"), ("user_id", f"eq.{profile['id']}")])
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/account/wishlist", response_model=list[ProductRead])
def add_account_wishlist(payload: WishlistWrite, authorization: str | None = Header(default=None)) -> list[ProductRead]:
    profile = _profile_for_token(_bearer_token(authorization))
    if not store.select("products", filters=[("slug", f"eq.{payload.product_slug}")], limit=1):
        raise HTTPException(status_code=404, detail="Product not found")
    if not store.select("wishlists", filters=[("user_id", f"eq.{profile['id']}"), ("product_slug", f"eq.{payload.product_slug}")], limit=1):
        store.insert("wishlists", {"user_id": profile["id"], "product_slug": payload.product_slug})
    return account_wishlist(authorization)


@app.delete("/api/account/wishlist/{slug}", response_model=list[ProductRead])
def remove_account_wishlist(slug: str, authorization: str | None = Header(default=None)) -> list[ProductRead]:
    profile = _profile_for_token(_bearer_token(authorization))
    store.delete("wishlists", filters=[("user_id", f"eq.{profile['id']}"), ("product_slug", f"eq.{slug}")])
    return account_wishlist(authorization)


@app.post("/api/analytics/events", status_code=status.HTTP_204_NO_CONTENT)
def record_analytics_event(payload: dict[str, Any], authorization: str | None = Header(default=None)) -> Response:
    user_id = None
    if authorization:
        try:
            user_id = _profile_for_token(_bearer_token(authorization))["id"]
        except HTTPException:
            user_id = None
    store.insert("analytics_events", {"event_name": str(payload.get("event_name", "page_view"))[:80], "path": str(payload.get("path", ""))[:500], "user_id": user_id, "metadata": payload.get("metadata", {})})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/discounts/validate")
def validate_coupon(payload: CouponValidate) -> dict[str, Any]:
    rows = store.select("discounts", filters=[("code", f"eq.{payload.code.upper()}"), ("active", "eq.true")], limit=1)
    if not rows:
        raise HTTPException(status_code=404, detail="Coupon is not active")
    discount = rows[0]
    if discount.get("expires_at") and str(discount["expires_at"]) <= datetime.utcnow().isoformat():
        raise HTTPException(status_code=400, detail="Coupon has expired")
    if discount.get("max_uses") is not None and int(discount.get("uses_count", 0)) >= int(discount["max_uses"]):
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    if payload.subtotal < float(discount.get("minimum_order", 0)):
        raise HTTPException(status_code=400, detail=f"Minimum order is ₹{discount['minimum_order']}")
    discount_value = payload.subtotal * float(discount["amount"]) / 100 if discount["kind"] == "percentage" else float(discount["amount"])
    return {"code": discount["code"], "discount": round(min(discount_value, payload.subtotal), 2), "kind": discount["kind"], "amount": discount["amount"]}


@app.get("/api/admin/overview", response_model=AdminOverview)
def admin_overview(authorization: str | None = Header(default=None)) -> AdminOverview:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)

    products = store.select("products", order="id.asc")
    orders = store.select("orders", select="*,order_items(*)", order="id.desc")
    top_products: list[AdminProductSummary] = []
    for product in products[:3]:
        sold = 0
        revenue = 0.0
        for order in orders:
            for item in order.get("order_items", []) or []:
                if item["product_slug"] == product["slug"]:
                    sold += int(item["quantity"])
                    revenue += float(item["quantity"]) * float(item["price"])
        top_products.append(
            AdminProductSummary(
                slug=product["slug"],
                name=product["name"],
                sold=sold,
                revenue=revenue,
                image=product["image"],
            )
        )

    net_sales = sum(float(order["total"]) for order in orders)
    order_count = len(orders)
    average_order = round(net_sales / order_count, 2) if order_count else 0
    conversion = 4.82
    chart = [25, 45, 38, 58, 47, 70, 61, 82, 73, 90, 77, 100]
    return AdminOverview(
        live_visitors=28,
        net_sales=net_sales,
        orders=order_count,
        average_order=average_order,
        conversion=conversion,
        chart=chart,
        top_products=top_products,
        metrics=[
            AdminSpark(label="Net sales", value=net_sales, delta="↑ 18.4% vs last week"),
            AdminSpark(label="Orders", value=order_count, delta="↑ 12.1% vs last week"),
            AdminSpark(label="Avg. order", value=average_order, delta="↑ 4.8% vs last week"),
            AdminSpark(label="Conversion", value=f"{conversion}%", delta="↑ 0.6% vs last week"),
        ],
    )


@app.get("/api/admin/customers", response_model=list[UserRead])
def admin_customers(authorization: str | None = Header(default=None)) -> list[UserRead]:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    return [_as_user(row) for row in store.select("users", order="created_at.desc")]


@app.patch("/api/admin/customers/{customer_id}", response_model=UserRead)
def update_admin_customer(customer_id: int, payload: CustomerUpdate, authorization: str | None = Header(default=None)) -> UserRead:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    data = payload.model_dump(exclude_none=True)
    updated = store.update("users", filters=[("id", f"eq.{customer_id}")], payload=data)
    if not updated:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _as_user(updated[0])


@app.delete("/api/admin/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_customer(customer_id: int, authorization: str | None = Header(default=None)) -> Response:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    target = store.select("users", filters=[("id", f"eq.{customer_id}")], limit=1)
    if not target or str(target[0].get("role")) == "admin":
        raise HTTPException(status_code=404, detail="Customer not found")
    auth_user = next((user for user in store.auth_admin_list_users() if str(user.get("email", "")).lower() == str(target[0]["email"]).lower()), None)
    if auth_user and auth_user.get("id"):
        store.auth_admin_delete_user(str(auth_user["id"]))
    store.delete("users", filters=[("id", f"eq.{customer_id}")])
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/admin/discounts", response_model=list[DiscountRead])
def admin_discounts(authorization: str | None = Header(default=None)) -> list[DiscountRead]:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    return [DiscountRead.model_validate(row) for row in store.select("discounts", order="created_at.desc")]


@app.post("/api/admin/discounts", response_model=DiscountRead, status_code=status.HTTP_201_CREATED)
def create_admin_discount(payload: DiscountWrite, authorization: str | None = Header(default=None)) -> DiscountRead:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    created = store.insert("discounts", payload.model_dump(mode="json"))
    return DiscountRead.model_validate(created[0])


@app.patch("/api/admin/discounts/{discount_id}", response_model=DiscountRead)
def update_admin_discount(discount_id: int, payload: DiscountWrite, authorization: str | None = Header(default=None)) -> DiscountRead:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    updated = store.update("discounts", filters=[("id", f"eq.{discount_id}")], payload=payload.model_dump(mode="json"))
    if not updated: raise HTTPException(status_code=404, detail="Discount not found")
    return DiscountRead.model_validate(updated[0])


@app.delete("/api/admin/discounts/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_discount(discount_id: int, authorization: str | None = Header(default=None)) -> Response:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    store.delete("discounts", filters=[("id", f"eq.{discount_id}")])
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/admin/content", response_model=list[CmsRead])
def admin_content(authorization: str | None = Header(default=None)) -> list[CmsRead]:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    return [CmsRead.model_validate(row) for row in store.select("cms_content", order="updated_at.desc")]


@app.post("/api/admin/content", response_model=CmsRead, status_code=status.HTTP_201_CREATED)
def create_admin_content(payload: CmsWrite, authorization: str | None = Header(default=None)) -> CmsRead:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    created = store.insert("cms_content", payload.model_dump(mode="json"))
    return CmsRead.model_validate(created[0])


@app.patch("/api/admin/content/{content_id}", response_model=CmsRead)
def update_admin_content(content_id: int, payload: CmsWrite, authorization: str | None = Header(default=None)) -> CmsRead:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    updated = store.update("cms_content", filters=[("id", f"eq.{content_id}")], payload={**payload.model_dump(mode="json"), "updated_at": datetime.utcnow().isoformat()})
    if not updated: raise HTTPException(status_code=404, detail="Content not found")
    return CmsRead.model_validate(updated[0])


@app.get("/api/admin/analytics")
def admin_analytics(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    profile = _profile_for_token(_bearer_token(authorization)); _require_admin(profile)
    events = store.select("analytics_events", order="created_at.desc", limit=1000)
    counts: dict[str, int] = {}
    for event in events: counts[str(event["event_name"])] = counts.get(str(event["event_name"]), 0) + 1
    return {"total_events": len(events), "events_by_name": counts, "recent": events[:20]}


@app.get("/api/admin/orders", response_model=list[OrderRead])
def admin_orders(authorization: str | None = Header(default=None)) -> list[OrderRead]:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    orders = store.select("orders", select="*,order_items(*)", order="id.desc")
    return [_read_order(order) for order in orders]


@app.get("/api/admin/products", response_model=list[ProductRead])
def admin_products(authorization: str | None = Header(default=None)) -> list[ProductRead]:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    return [_as_product(product) for product in store.select("products", order="id.asc")]


@app.post("/api/admin/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_admin_product(
    payload: ProductCreate,
    authorization: str | None = Header(default=None),
) -> ProductRead:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    if store.select("products", filters=[("slug", f"eq.{payload.slug}")], limit=1):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product slug already exists")
    created = store.insert("products", payload.model_dump())
    return _as_product(created[0])


@app.put("/api/admin/products/{slug}", response_model=ProductRead)
def update_admin_product(
    slug: str,
    payload: ProductUpdate,
    authorization: str | None = Header(default=None),
) -> ProductRead:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    data = payload.model_dump(exclude_none=True)
    if "slug" in data and data["slug"] != slug and store.select("products", filters=[("slug", f"eq.{data['slug']}")], limit=1):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product slug already exists")
    if not data:
        existing = store.select("products", filters=[("slug", f"eq.{slug}")], limit=1)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return _as_product(existing[0])
    updated = store.update("products", filters=[("slug", f"eq.{slug}")], payload=data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _as_product(updated[0])


@app.delete("/api/admin/products/{slug}", response_class=Response)
def delete_admin_product(slug: str, authorization: str | None = Header(default=None)) -> Response:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    deleted = store.delete("products", filters=[("slug", f"eq.{slug}")])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.patch("/api/admin/orders/{number}", response_model=OrderRead)
def update_admin_order_status(
    number: str,
    payload: OrderStatusUpdate,
    authorization: str | None = Header(default=None),
) -> OrderRead:
    profile = _profile_for_token(_bearer_token(authorization))
    _require_admin(profile)
    updated = store.update("orders", filters=[("number", f"eq.{number}")], payload={"status": payload.status})
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order = store.select("orders", filters=[("number", f"eq.{number}")], select="*,order_items(*)", limit=1)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _read_order(order[0])


@app.post("/api/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: CheckoutRequest, authorization: str | None = Header(default=None)) -> OrderRead:
    token = _bearer_token(authorization)
    _profile_for_token(token)
    try:
        result = store.rpc("checkout_order", {
            "p_items": [item.model_dump() for item in payload.items],
            "p_shipping": payload.shipping.model_dump(),
        }, bearer=token)
    except RuntimeError as exc:
        message = str(exc)
        if "Insufficient stock" in message:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message) from exc
        if "unavailable" in message.lower() or "quantity" in message.lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message) from exc
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to place order") from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to place order")
    # COD orders are confirmed for fulfilment, not marked as paid upfront.
    store.update("orders", filters=[("number", f"eq.{result[0]['order_number']}")], payload={"status": "Confirmed"})
    stored = store.select("orders", filters=[("number", f"eq.{result[0]['order_number']}")], select="*,order_items(*)", limit=1)
    if not stored:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Order confirmation unavailable")
    return _read_order(stored[0])


@app.get("/api/orders/{number}", response_model=OrderRead)
def get_customer_order(number: str, authorization: str | None = Header(default=None)) -> OrderRead:
    profile = _profile_for_token(_bearer_token(authorization))
    orders = store.select(
        "orders",
        filters=[("number", f"eq.{number}"), ("customer_email", f"eq.{profile['email']}")],
        select="*,order_items(*)",
        limit=1,
    )
    if not orders:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _read_order(orders[0])


@app.get("/api/admin/ping")
def admin_ping() -> dict[str, str]:
    return {"status": "admin-ready", "time": datetime.utcnow().isoformat()}

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=2, max_length=120)
    kicker: str = Field(max_length=160)
    claim: str = Field(max_length=200)
    intro: str = Field(max_length=600)
    price: float = Field(gt=0, le=100000)
    mrp: float = Field(gt=0, le=100000)
    image: str = Field(max_length=500)
    tone: str = Field(max_length=30)
    accent: str = Field(max_length=30)
    tag: str = Field(max_length=60)
    rating: str = Field(max_length=10)
    category: str = Field(max_length=80)
    ingredients: list[str] = Field(max_length=20)
    benefits: list[str] = Field(max_length=20)
    stock: int = Field(ge=0, le=100000)

    @field_validator("mrp")
    @classmethod
    def mrp_cannot_be_below_price(cls, value: float, info):
        price = info.data.get("price")
        if price is not None and value < price:
            raise ValueError("mrp must be greater than or equal to price")
        return value


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    name: str | None = Field(default=None, min_length=2, max_length=120)
    kicker: str | None = Field(default=None, max_length=160)
    claim: str | None = Field(default=None, max_length=200)
    intro: str | None = Field(default=None, max_length=600)
    price: float | None = Field(default=None, gt=0, le=100000)
    mrp: float | None = Field(default=None, gt=0, le=100000)
    image: str | None = Field(default=None, max_length=500)
    tone: str | None = Field(default=None, max_length=30)
    accent: str | None = Field(default=None, max_length=30)
    tag: str | None = Field(default=None, max_length=60)
    rating: str | None = Field(default=None, max_length=10)
    category: str | None = Field(default=None, max_length=80)
    ingredients: list[str] | None = Field(default=None, max_length=20)
    benefits: list[str] | None = Field(default=None, max_length=20)
    stock: int | None = Field(default=None, ge=0, le=100000)


class OrderStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(Paid|Packed|Shipped|Delivered|Cancelled)$")


class CheckoutItem(BaseModel):
    product_slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    quantity: int = Field(ge=1, le=20)


class ShippingAddress(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=7, max_length=30)
    address: str = Field(min_length=5, max_length=240)
    city: str = Field(min_length=2, max_length=80)
    postal_code: str = Field(min_length=3, max_length=12)


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem] = Field(min_length=1, max_length=30)
    shipping: ShippingAddress
    payment_method: str = Field(default="cod", pattern=r"^cod$")


class ProductRead(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    password: str = Field(min_length=6)


class UserRead(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    phone: str | None = None
    city: str | None = None
    glow_points: int
    avatar_url: str | None = None
    skin_type: str | None = None
    skin_concerns: str | None = None
    profile_completion_percent: int = 0
    model_config = ConfigDict(from_attributes=True)


class CustomerUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    phone: str | None = Field(default=None, max_length=30)
    city: str | None = Field(default=None, max_length=80)
    role: str | None = Field(default=None, pattern=r"^(customer|admin)$")
    email: str | None = Field(default=None, max_length=160)
    avatar_url: str | None = Field(default=None, max_length=500)
    skin_type: str | None = Field(default=None, max_length=80)
    skin_concerns: str | None = Field(default=None, max_length=240)


class ProfileUpdate(CustomerUpdate):
    role: str | None = None


class AddressWrite(BaseModel):
    label: str = Field(default="Home", min_length=1, max_length=40)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    line1: str = Field(min_length=5, max_length=240)
    line2: str | None = Field(default=None, max_length=240)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    postal_code: str = Field(min_length=3, max_length=12)
    country: str = Field(default="India", min_length=2, max_length=80)
    is_default: bool = False


class AddressRead(AddressWrite):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class DiscountWrite(BaseModel):
    code: str = Field(min_length=3, max_length=40, pattern=r"^[A-Z0-9_-]+$")
    kind: str = Field(default="percentage", pattern=r"^(percentage|fixed)$")
    amount: float = Field(gt=0)
    minimum_order: float = Field(default=0, ge=0)
    max_uses: int | None = Field(default=None, gt=0)
    active: bool = True
    expires_at: datetime | None = None


class DiscountRead(DiscountWrite):
    id: int
    uses_count: int


class CouponValidate(BaseModel):
    code: str = Field(min_length=3, max_length=40)
    subtotal: float = Field(ge=0)


class CmsWrite(BaseModel):
    content_key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9_-]+$")
    title: str = Field(min_length=1, max_length=160)
    body: str = Field(default="", max_length=10000)
    image: str | None = Field(default=None, max_length=500)
    status: str = Field(default="draft", pattern=r"^(draft|published)$")


class CmsRead(CmsWrite):
    id: int
    updated_at: datetime


class WishlistWrite(BaseModel):
    product_slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")


class AuthSession(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int | None = None
    user: UserRead


class OrderItemRead(BaseModel):
    product_slug: str
    product_name: str
    price: float
    quantity: int


class OrderRead(BaseModel):
    number: str
    customer_name: str
    customer_email: str
    status: str
    total: float
    item_count: int
    shipping_eta: str
    items: list[OrderItemRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AccountOverview(BaseModel):
    profile: UserRead
    active_order: OrderRead | None
    recent_orders: list[OrderRead]
    saved_products: list[ProductRead]
    am_routine: list[ProductRead]


class AdminSpark(BaseModel):
    label: str
    value: float | str
    delta: str


class AdminProductSummary(BaseModel):
    slug: str
    name: str
    sold: int
    revenue: float
    image: str


class AdminOverview(BaseModel):
    live_visitors: int
    net_sales: float
    orders: int
    average_order: float
    conversion: float
    chart: list[float]
    top_products: list[AdminProductSummary]
    metrics: list[AdminSpark]


class SiteStats(BaseModel):
    customer_love: str
    formulas: int
    joy_score: str

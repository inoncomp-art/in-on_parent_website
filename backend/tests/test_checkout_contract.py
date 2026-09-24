from pathlib import Path

from app.schemas import CheckoutRequest


def test_checkout_contract_requires_idempotency_and_preserves_shipping_fields() -> None:
    payload = CheckoutRequest.model_validate(
        {
            "items": [{"product_slug": "cucumber-face-wash", "quantity": 1}],
            "shipping": {
                "first_name": "Asha",
                "last_name": "Sharma",
                "phone": "9999999999",
                "address": "10 Main Street",
                "city": "New Delhi",
                "state": "Delhi",
                "postal_code": "110001",
                "country": "India",
            },
            "coupon_code": "GLOW15",
            "idempotency_key": "checkout-test-key-0001",
        }
    )
    assert payload.coupon_code == "GLOW15"
    assert payload.shipping.state == "Delhi"
    assert payload.shipping.country == "India"


def test_checkout_migration_contains_transactional_guards() -> None:
    migration = Path(__file__).parents[1] / "supabase" / "migrations" / "202609240001_checkout_hardening.sql"
    sql = migration.read_text(encoding="utf-8")
    for required in (
        "for update",
        "uses_count = uses_count + 1",
        "idempotency_key",
        "shipping_address",
        "stock = stock -",
        "expires_at is not null",
        "max_uses is not null",
        "pg_advisory_xact_lock",
    ):
        assert required in sql


def test_invalid_expired_and_exhausted_coupon_paths_are_server_side() -> None:
    sql = (Path(__file__).parents[1] / "supabase" / "migrations" / "202609240001_checkout_hardening.sql").read_text(encoding="utf-8")
    assert "Coupon is not active" in sql
    assert "Coupon has expired" in sql
    assert "Coupon usage limit reached" in sql


def test_shipping_snapshot_contains_all_fulfillment_fields() -> None:
    sql = (Path(__file__).parents[1] / "supabase" / "migrations" / "202609240001_checkout_hardening.sql").read_text(encoding="utf-8")
    for field in ("shipping_phone", "shipping_address", "shipping_city", "shipping_state", "shipping_postal_code", "shipping_country"):
        assert field in sql

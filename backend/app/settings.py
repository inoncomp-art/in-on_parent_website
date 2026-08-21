from dataclasses import dataclass
from pathlib import Path
import os


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'").strip('"'))

_load_dotenv()


@dataclass(frozen=True)
class Settings:
    app_name: str = "In&On API"
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./inon.db")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_publishable_key: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    cors_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
    )
    seed_admin_email: str = os.getenv("SEED_ADMIN_EMAIL", "admin@inon.local")
    seed_admin_password: str = os.getenv("SEED_ADMIN_PASSWORD", "inon-demo")
    seed_customer_email: str = os.getenv("SEED_CUSTOMER_EMAIL", "ananya@inon.local")
    seed_customer_password: str = os.getenv("SEED_CUSTOMER_PASSWORD", "inon-demo")

    @property
    def cors_origin_list(self) -> list[str]:
        configured = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        production_origins = [
            "https://inon-storefront.pages.dev",
            "https://inon-admin.pages.dev",
        ]
        return list(dict.fromkeys(configured + production_origins))


settings = Settings()

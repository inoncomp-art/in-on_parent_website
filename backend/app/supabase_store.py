from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def _json(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


@dataclass(frozen=True)
class SupabaseStore:
    url: str
    service_role_key: str
    publishable_key: str | None = None

    @property
    def _base_rest_url(self) -> str:
        return f"{self.url.rstrip('/')}/rest/v1"

    @property
    def _base_storage_url(self) -> str:
        return f"{self.url.rstrip('/')}/storage/v1"

    def _headers(self, prefer: str | None = None, *, bearer: str | None = None) -> dict[str, str]:
        api_key = self.service_role_key or self.publishable_key
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if api_key:
            headers["apikey"] = api_key
        if bearer:
            headers["Authorization"] = f"Bearer {bearer}"
        if prefer:
            headers["Prefer"] = prefer
        return headers

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: list[tuple[str, str]] | None = None,
        payload: Any = None,
        prefer: str | None = None,
        base_url: str | None = None,
        bearer: str | None = None,
    ) -> Any:
        url = f"{(base_url or self._base_rest_url).rstrip('/')}/{path.lstrip('/')}"
        if params:
            url = f"{url}?{urlencode(params, doseq=True)}"
        body = None if payload is None else _json(payload).encode("utf-8")
        request = Request(url, data=body, headers=self._headers(prefer, bearer=bearer), method=method)
        try:
            with urlopen(request, timeout=45) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Supabase {method} {path} failed: {exc.code} {detail}") from exc

    def select(
        self,
        table: str,
        *,
        filters: list[tuple[str, str]] | None = None,
        select: str = "*",
        order: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        params: list[tuple[str, str]] = [("select", select)]
        if filters:
            params.extend(filters)
        if order:
            params.append(("order", order))
        if limit is not None:
            params.append(("limit", str(limit)))
        data = self._request("GET", table, params=params)
        return list(data or [])

    def insert(self, table: str, rows: list[dict[str, Any]] | dict[str, Any]) -> list[dict[str, Any]]:
        payload = rows
        if isinstance(rows, dict):
            payload = rows
        data = self._request("POST", table, payload=payload, prefer="return=representation")
        return list(data or [])

    def update(
        self,
        table: str,
        *,
        filters: list[tuple[str, str]],
        payload: dict[str, Any],
    ) -> list[dict[str, Any]]:
        data = self._request(
            "PATCH",
            table,
            params=filters,
            payload=payload,
            prefer="return=representation",
        )
        return list(data or [])

    def delete(self, table: str, *, filters: list[tuple[str, str]]) -> list[dict[str, Any]]:
        data = self._request("DELETE", table, params=filters, prefer="return=representation")
        return list(data or [])

    def rpc(self, function_name: str, payload: dict[str, Any], *, bearer: str | None = None) -> list[dict[str, Any]]:
        data = self._request(
            "POST",
            f"rpc/{function_name}",
            payload=payload,
            prefer="return=representation",
            bearer=bearer,
        )
        return list(data or []) if isinstance(data, list) else ([data] if data else [])

    def create_storage_bucket(self, bucket_id: str, name: str, public: bool = True) -> None:
        existing = self._request(
            "GET",
            "bucket",
            base_url=self._base_storage_url,
            params=[("limit", "100")],
        )
        for bucket in existing or []:
            if bucket.get("id") == bucket_id:
                if bucket.get("public") != public or bucket.get("name") != name:
                    self._request(
                        "PUT",
                        f"bucket/{bucket_id}",
                        base_url=self._base_storage_url,
                        payload={"name": name, "public": public},
                    )
                return
        self._request(
            "POST",
            "bucket",
            base_url=self._base_storage_url,
            payload={"id": bucket_id, "name": name, "public": public},
        )

    def auth_admin_create_user(self, email: str, password: str, *, email_confirm: bool = True) -> dict[str, Any]:
        return self._request(
            "POST",
            "admin/users",
            base_url=f"{self.url.rstrip('/')}/auth/v1",
            payload={
                "email": email,
                "password": password,
                "email_confirm": email_confirm,
            },
        )

    def auth_admin_list_users(self) -> list[dict[str, Any]]:
        data = self._request(
            "GET",
            "admin/users",
            base_url=f"{self.url.rstrip('/')}/auth/v1",
            params=[("page", "1"), ("per_page", "200")],
        )
        if isinstance(data, dict):
            return list(data.get("users", []) or [])
        return list(data or [])

    def auth_admin_update_user(self, user_id: str, *, password: str | None = None, email: str | None = None, email_confirm: bool | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {}
        if password is not None:
            payload["password"] = password
        if email is not None:
            payload["email"] = email
        if email_confirm is not None:
            payload["email_confirm"] = email_confirm
        return self._request(
            "PUT",
            f"admin/users/{user_id}",
            base_url=f"{self.url.rstrip('/')}/auth/v1",
            payload=payload,
        )

    def auth_admin_delete_user(self, user_id: str) -> None:
        self._request("DELETE", f"admin/users/{user_id}", base_url=f"{self.url.rstrip('/')}/auth/v1")

    def auth_password_login(self, email: str, password: str) -> dict[str, Any]:
        return self._request(
            "POST",
            "token?grant_type=password",
            base_url=f"{self.url.rstrip('/')}/auth/v1",
            payload={
                "email": email,
                "password": password,
            },
        )

    def auth_user(self, access_token: str) -> dict[str, Any]:
        return self._request(
            "GET",
            "user",
            base_url=f"{self.url.rstrip('/')}/auth/v1",
            bearer=access_token,
        )

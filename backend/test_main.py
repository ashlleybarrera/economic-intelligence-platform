from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_login_for_access_token():
    """
    Test that a user can successfully request a JWT token.
    Because of our auto-register logic, this will create the user if it doesn't exist.
    """
    response = client.post(
        "/token",
        data={"username": "tester_admin", "password": "secure_password_123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_unauthorized_access():
    """
    Test that endpoints are protected and return 401 without a valid token.
    """
    response = client.get("/api/market-data/VNQ")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_authorized_market_data_access():
    """
    Test that a valid JWT token grants access to the data ingestion endpoint.
    """
    # 1. Obtain Token
    login_response = client.post(
        "/token",
        data={"username": "tester_admin", "password": "secure_password_123"}
    )
    token = login_response.json()["access_token"]

    # 2. Use Token in Headers
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/market-data/VNQ", headers=headers)
    
    assert response.status_code == 200
    assert "ticker" in response.json()
    assert response.json()["ticker"] == "VNQ"
    assert "prices" in response.json()
    assert len(response.json()["prices"]) > 0
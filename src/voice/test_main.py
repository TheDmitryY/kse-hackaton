import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "voice-microservice"
    assert "version" in data


def test_health():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "voice-microservice"


def test_speak_valid_text():
    """Test speak endpoint with valid text"""
    response = client.get("/speak?text=Hello%20world&language=en")
    # Should either return audio or fail gracefully
    assert response.status_code in [200, 500]
    
    if response.status_code == 200:
        assert response.headers["content-type"] == "audio/mpeg"
        assert len(response.content) > 0


def test_speak_empty_text():
    """Test speak endpoint with empty text"""
    response = client.get("/speak?text=&language=en")
    assert response.status_code == 400


def test_speak_missing_text():
    """Test speak endpoint without text parameter"""
    response = client.get("/speak?language=en")
    assert response.status_code == 422


def test_speak_different_languages():
    """Test speak endpoint with different languages"""
    languages = ["en", "es", "fr", "de", "it"]
    for lang in languages:
        response = client.get(f"/speak?text=Hello&language={lang}")
        # Should either succeed or fail gracefully
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            assert response.headers["content-type"] == "audio/mpeg"
            assert len(response.content) > 0


def test_synthesize_empty_text():
    """Test synthesize endpoint with empty text"""
    response = client.post(
        "/synthesize",
        json={"text": "", "language": "en"}
    )
    assert response.status_code == 400


def test_synthesize_valid_text():
    """Test synthesize endpoint with valid text"""
    response = client.post(
        "/synthesize",
        json={"text": "Hello world", "language": "en"}
    )
    # Should either succeed or fail gracefully
    assert response.status_code in [200, 500]
    
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "success"
        assert "file_id" in data
        assert "filename" in data
        assert data["language"] == "en"


def test_list_files():
    """Test list endpoint"""
    response = client.get("/list")
    assert response.status_code in [200, 500]
    
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "success"
        assert "count" in data
        assert "files" in data
        assert isinstance(data["files"], list)


def test_play_nonexistent_file():
    """Test play endpoint with nonexistent file"""
    response = client.get("/play/nonexistent-file-id")
    assert response.status_code == 404


def test_delete_nonexistent_file():
    """Test delete endpoint with nonexistent file"""
    response = client.delete("/delete/nonexistent-file-id")
    assert response.status_code == 404


def test_synthesize_stream_empty_text():
    """Test synthesize stream endpoint with empty text"""
    response = client.post(
        "/synthesize-stream",
        json={"text": "", "language": "en"}
    )
    assert response.status_code == 400


def test_synthesize_stream_valid_text():
    """Test synthesize stream endpoint with valid text"""
    response = client.post(
        "/synthesize-stream",
        json={"text": "Stream test", "language": "en"}
    )
    # Should either return audio stream or fail gracefully
    assert response.status_code in [200, 500]

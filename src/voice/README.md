# Voice Microservice

A FastAPI-based text-to-speech microservice for converting text to audio files.

## Features

- **Text-to-Speech Conversion**: Convert text to audio files (MP3 format)
- **Multiple TTS Engines**: Support for both Google Text-to-Speech (gTTS) and pyttsx3
- **Language Support**: Multiple language support via gTTS
- **Audio File Management**: List, play, and delete synthesized audio files
- **Stream Support**: Real-time audio streaming capability
- **Docker Integration**: Fully containerized with Docker Compose support
- **Health Checks**: Built-in health check endpoints

## API Endpoints

### Health Check
- `GET /` - Service status and version info
- `GET /health` - Health check endpoint

### Text-to-Speech (Simple)
- `GET /speak?text=<text>&language=<lang>` - Convert text to speech and return audio directly
  - **Parameters:**
    - `text` (required): Text to convert to speech
    - `language` (optional): Language code (default: en)
  - **Returns:** MP3 audio file stream
  - **Example:** `GET /speak?text=Hello%20world&language=en`

### Text-to-Speech (Advanced)
- `POST /synthesize` - Convert text to speech and save file
  ```json
  {
    "text": "Hello world",
    "language": "en",
    "speed": 1.0
  }
  ```
  - **Returns:** File ID and metadata
  
- `POST /synthesize-stream` - Stream audio directly
  ```json
  {
    "text": "Hello world",
    "language": "en",
    "speed": 1.0
  }
  ```
  - **Returns:** Audio stream

### Audio Management
- `GET /play/{file_id}` - Play a synthesized audio file
- `GET /list` - List all synthesized audio files
- `DELETE /delete/{file_id}` - Delete an audio file

## Setup

### Local Development
```bash
cd src/voice
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running Locally
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Docker Compose
The service is integrated into the main docker-compose.yaml. To start:
```bash
docker-compose up voice
```

## Environment Variables

- `VOICE_PORT` - Service port (default: 8001)
- `PYTHONUNBUFFERED` - Python output buffering (set to 1)

## Volume Mounts

- `/tmp/voice_audio` - Stores synthesized audio files (persisted as `voice_audio` volume)

## Network Access

The service is accessible on the `kse` Docker network:
- From other services: `http://voice:8001`
- From host: `http://localhost:8001`

## Requirements

- Python 3.11+
- FastAPI
- gTTS (Google Text-to-Speech)
- pyttsx3 (offline TTS fallback)
- FFmpeg (for audio processing)
- espeak-ng (for pyttsx3)

## Examples

### Quick Start: Speak (Simple)
The simplest way to get speech audio:
```bash
# Get audio directly from text (English)
curl -X GET "http://localhost:8001/speak?text=Hello%20world&language=en" --output hello.mp3

# Different language
curl -X GET "http://localhost:8001/speak?text=Hola%20mundo&language=es" --output hola.mp3
```

### Supported Languages
Common language codes: `en`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `ja`, `zh`, `ko`, and many more

### Advanced: Synthesize and save file ID
```bash
curl -X POST http://localhost:8001/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'
```

Response:
```json
{
  "status": "success",
  "file_id": "abc123...",
  "filename": "speech_abc123....mp3",
  "language": "en",
  "text_length": 11
}
```

### Play the audio file
```bash
curl -X GET http://localhost:8001/play/abc123... --output speech.mp3
```

### Stream audio directly (POST)
```bash
curl -X POST http://localhost:8001/synthesize-stream \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}' --output stream.mp3
```

### List all audio files
```bash
curl -X GET http://localhost:8001/list
```

### Delete an audio file
```bash
curl -X DELETE http://localhost:8001/delete/abc123...
```

## Architecture

```
src/voice/
├── app/
│   ├── __init__.py
│   └── main.py          # FastAPI application
├── Dockerfile           # Container definition
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Health Checks

The service includes Docker health checks:
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
- Start period: 5 seconds

The `/health` endpoint returns:
```json
{
  "status": "healthy",
  "service": "voice-microservice",
  "tts_engine": "gtts"
}
```

## Troubleshooting

### gTTS not working
- Check internet connection (gTTS requires network access)
- Verify you can reach Google's TTS service

### pyttsx3 not working
- Ensure espeak-ng is installed: `apt-get install espeak-ng`
- Check system audio setup

### Port already in use
- Change VOICE_PORT in .env file
- Update docker-compose.yaml exposure settings

## Development Notes

- Audio files are stored in `/tmp/voice_audio` inside the container
- Files are persisted using Docker volumes
- The service uses UUID-based file naming for safety
- All endpoints support CORS headers when configured

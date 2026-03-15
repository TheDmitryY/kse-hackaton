from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import logging
import os
import uuid
from pydantic import BaseModel
import io

# TTS library - using pyttsx3 or gtts
try:
    from gtts import gTTS
    TTS_ENGINE = "gtts"
except ImportError:
    try:
        import pyttsx3
        TTS_ENGINE = "pyttsx3"
    except ImportError:
        TTS_ENGINE = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Voice Microservice",
    description="Text-to-speech microservice",
    version="1.0.0"
)

AUDIO_DIR = "/tmp/voice_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


class TextToSpeechRequest(BaseModel):
    text: str
    language: str = "en"
    speed: float = 1.0


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "voice-microservice",
        "version": "1.0.0",
        "tts_engine": TTS_ENGINE
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {
        "status": "healthy",
        "service": "voice-microservice",
        "tts_engine": TTS_ENGINE
    }


@app.get("/speak")
async def speak(text: str, language: str = "en"):
    """Convert text to speech and return audio directly
    
    Args:
        text: The text to convert to speech
        language: Language code (default: en)
    
    Returns:
        Audio file (MP3 format)
    """
    try:
        if not text or len(text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if TTS_ENGINE is None:
            raise HTTPException(status_code=500, detail="TTS engine not available")
        
        if TTS_ENGINE == "gtts":
            tts = gTTS(text=text, lang=language, slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            logger.info(f"Audio generated via /speak: {len(text)} chars, language={language}")
            
            return StreamingResponse(
                iter([audio_buffer.getvalue()]),
                media_type="audio/mpeg",
                headers={"Content-Disposition": f"attachment; filename=speech_{language}.mp3"}
            )
        else:
            raise HTTPException(status_code=500, detail="Streaming not supported with current TTS engine")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Speak error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/synthesize")
async def synthesize_speech(request: TextToSpeechRequest):
    """Convert text to speech and save as audio file"""
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if TTS_ENGINE is None:
            raise HTTPException(status_code=500, detail="TTS engine not available")
        
        file_id = str(uuid.uuid4())
        output_filename = f"speech_{file_id}.mp3"
        output_path = os.path.join(AUDIO_DIR, output_filename)
        
        if TTS_ENGINE == "gtts":
            tts = gTTS(text=request.text, lang=request.language, slow=False)
            tts.save(output_path)
        elif TTS_ENGINE == "pyttsx3":
            engine = pyttsx3.init()
            engine.setProperty('rate', 150 * request.speed)
            engine.save_to_file(request.text, output_path)
            engine.runAndWait()
        
        logger.info(f"Speech synthesized: {output_filename}")
        
        return {
            "status": "success",
            "file_id": file_id,
            "filename": output_filename,
            "language": request.language,
            "text_length": len(request.text)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Synthesis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/synthesize-stream")
async def synthesize_speech_stream(request: TextToSpeechRequest):
    """Convert text to speech and stream audio"""
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if TTS_ENGINE is None:
            raise HTTPException(status_code=500, detail="TTS engine not available")
        
        if TTS_ENGINE == "gtts":
            tts = gTTS(text=request.text, lang=request.language, slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            logger.info(f"Speech stream generated for text: {request.text[:50]}")
            
            return StreamingResponse(
                iter([audio_buffer.getvalue()]),
                media_type="audio/mpeg"
            )
        else:
            raise HTTPException(status_code=500, detail="Streaming not supported with current TTS engine")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stream synthesis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/play/{file_id}")
async def play_audio(file_id: str):
    """Play a synthesized audio file"""
    try:
        output_filename = f"speech_{file_id}.mp3"
        output_path = os.path.join(AUDIO_DIR, output_filename)
        
        if not os.path.exists(output_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        logger.info(f"Playing audio: {output_filename}")
        
        return FileResponse(
            path=output_path,
            media_type="audio/mpeg",
            filename=output_filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Playback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/list")
async def list_audio_files():
    """List all synthesized audio files"""
    try:
        files = os.listdir(AUDIO_DIR)
        audio_files = [f for f in files if f.endswith('.mp3')]
        
        return {
            "status": "success",
            "count": len(audio_files),
            "files": audio_files
        }
    except Exception as e:
        logger.error(f"List error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete/{file_id}")
async def delete_audio(file_id: str):
    """Delete a synthesized audio file"""
    try:
        output_filename = f"speech_{file_id}.mp3"
        output_path = os.path.join(AUDIO_DIR, output_filename)
        
        if not os.path.exists(output_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        os.remove(output_path)
        logger.info(f"Audio file deleted: {output_filename}")
        
        return {
            "status": "success",
            "message": f"File {output_filename} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

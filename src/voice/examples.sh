#!/usr/bin/env bash
# Example usage of the Voice Microservice

BASE_URL="http://localhost:8001"

echo "=== Voice Microservice Examples ==="
echo ""

# Check health
echo "1. Checking service health..."
curl -s -X GET "$BASE_URL/health" | python3 -m json.tool
echo ""

# Synthesize speech
echo "2. Synthesizing speech..."
RESPONSE=$(curl -s -X POST "$BASE_URL/synthesize" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, this is a test", "language": "en"}')
echo "$RESPONSE" | python3 -m json.tool
FILE_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['file_id'])" 2>/dev/null)
echo "File ID: $FILE_ID"
echo ""

# List audio files
echo "3. Listing audio files..."
curl -s -X GET "$BASE_URL/list" | python3 -m json.tool
echo ""

# Stream audio (if FILE_ID was extracted)
if [ ! -z "$FILE_ID" ]; then
    echo "4. Playing audio file..."
    curl -s -X GET "$BASE_URL/play/$FILE_ID" --output /tmp/speech.mp3
    if [ -f /tmp/speech.mp3 ]; then
        echo "✓ Audio saved to /tmp/speech.mp3"
        ls -lh /tmp/speech.mp3
    fi
    echo ""

    # Stream audio directly
    echo "5. Streaming audio directly..."
    curl -s -X POST "$BASE_URL/synthesize-stream" \
      -H "Content-Type: application/json" \
      -d '{"text": "Streaming test", "language": "en"}' --output /tmp/stream.mp3
    if [ -f /tmp/stream.mp3 ]; then
        echo "✓ Stream saved to /tmp/stream.mp3"
        ls -lh /tmp/stream.mp3
    fi
    echo ""

    # Delete audio file
    echo "6. Deleting audio file..."
    curl -s -X DELETE "$BASE_URL/delete/$FILE_ID" | python3 -m json.tool
    echo ""

    echo "7. Verifying deletion..."
    curl -s -X GET "$BASE_URL/list" | python3 -m json.tool
fi

echo "=== Examples Complete ==="

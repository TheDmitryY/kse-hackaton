build:
	docker build -t kse-api:latest -f docker/Dockerfile .
	docker compose up -d

	
stop:
	docker compose down -v

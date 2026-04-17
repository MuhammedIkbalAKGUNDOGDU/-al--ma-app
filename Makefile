.PHONY: setup dev build docker-up docker-down

setup:
	cd backend && npm install
	cd frontend && npm install
	cd backend && npx prisma generate

dev-backend:
	cd backend && npm start

dev-frontend:
	cd frontend && npm run dev

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

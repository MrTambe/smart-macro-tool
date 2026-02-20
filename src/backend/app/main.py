from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.api import files, ai, macros, spreadsheet, ai_review
from app.services.websocket_manager import ConnectionManager


CLEAN_ARCH_AVAILABLE = False
AIReviewUseCase = None
ChangeRepository = None
AIChangeSuggestionService = None
SpreadsheetChangeApplier = None

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# WebSocket manager
manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Smart Macro Tool Backend...")
    yield
    logger.info("Shutting down Smart Macro Tool Backend...")


app = FastAPI(
    title="Smart Macro Tool API",
    description="Backend API for Smart Macro Tool - Intelligent automation system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(macros.router, prefix="/api/macros", tags=["macros"])
app.include_router(spreadsheet.router, prefix="/api/spreadsheet", tags=["spreadsheet"])
app.include_router(ai_review.router, prefix="/api/ai-review", tags=["ai-review"])

# Initialize AI review service (disabled - uncomment when clean arch is ready)
change_repository = None
ai_change_service = None
change_applier = None


@app.get("/")
async def root():
    return {
        "name": "Smart Macro Tool API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "files": "available",
            "ai": "available",
            "macros": "available",
            "spreadsheet": "available"
        }
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()

            # Handle different message types
            message_type = data.get("type")

            if message_type == "ping":
                await manager.send_personal_message({"type": "pong"}, websocket)

            elif message_type == "macro_event":
                # Broadcast macro events to all connected clients
                await manager.broadcast({
                    "type": "macro_update",
                    "data": data.get("data")
                })

            elif message_type == "ai_request":
                # Handle AI streaming responses
                pass

            else:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                }, websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

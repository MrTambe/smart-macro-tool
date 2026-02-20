import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import asyncio


class MacroEngine:
    """Engine for recording and playing back macros"""

    def __init__(self):
        self.is_recording = False
        self.current_recording: List[Dict[str, Any]] = []
        self.recording_start_time: Optional[datetime] = None
        self.last_action_time: Optional[datetime] = None
        self.macros_dir = Path("./macros")
        self.macros_dir.mkdir(exist_ok=True)

    async def list_macros(self) -> List[Dict[str, Any]]:
        """List all saved macros"""
        macros = []
        for macro_file in self.macros_dir.glob("*.json"):
            try:
                with open(macro_file, 'r') as f:
                    macro = json.load(f)
                    macros.append(macro)
            except Exception as e:
                print(f"Error loading macro {macro_file}: {e}")

        macros.sort(key=lambda x: x.get("updatedAt", ""), reverse=True)
        return macros

    async def create_macro(self, macro_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new macro"""
        macro_id = str(int(datetime.now().timestamp() * 1000))

        macro = {
            "id": macro_id,
            "name": macro_data.get("name", f"Macro {macro_id}"),
            "description": macro_data.get("description", ""),
            "steps": macro_data.get("steps", []),
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "timesRun": 0
        }

        macro_file = self.macros_dir / f"{macro_id}.json"
        with open(macro_file, 'w') as f:
            json.dump(macro, f, indent=2)

        return macro

    async def get_macro(self, macro_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific macro"""
        macro_file = self.macros_dir / f"{macro_id}.json"
        if not macro_file.exists():
            return None

        with open(macro_file, 'r') as f:
            return json.load(f)

    async def update_macro(self, macro_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a macro"""
        macro = await self.get_macro(macro_id)
        if not macro:
            raise ValueError(f"Macro {macro_id} not found")

        for key, value in updates.items():
            if key in ["name", "description", "steps"]:
                macro[key] = value

        macro["updatedAt"] = datetime.now().isoformat()

        macro_file = self.macros_dir / f"{macro_id}.json"
        with open(macro_file, 'w') as f:
            json.dump(macro, f, indent=2)

        return macro

    async def delete_macro(self, macro_id: str) -> Dict[str, Any]:
        """Delete a macro"""
        macro_file = self.macros_dir / f"{macro_id}.json"
        if macro_file.exists():
            macro_file.unlink()
            return {"success": True, "message": f"Macro {macro_id} deleted"}
        else:
            raise ValueError(f"Macro {macro_id} not found")

    async def run_macro(self, macro_id: str) -> Dict[str, Any]:
        """Run a macro"""
        macro = await self.get_macro(macro_id)
        if not macro:
            raise ValueError(f"Macro {macro_id} not found")

        steps = macro.get("steps", [])
        results = []

        for i, step in enumerate(steps):
            try:
                result = await self._execute_step(step)
                results.append({"step": i, "success": True, "result": result})

                delay = step.get("delay", 0)
                if delay > 0:
                    await asyncio.sleep(delay / 1000)

            except Exception as e:
                results.append({"step": i, "success": False, "error": str(e)})

        macro["timesRun"] = macro.get("timesRun", 0) + 1
        macro["lastRun"] = datetime.now().isoformat()
        await self.update_macro(macro_id, {"timesRun": macro["timesRun"]})

        return {
            "success": True,
            "macro_id": macro_id,
            "steps_executed": len(steps),
            "results": results
        }

    async def _execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single macro step"""
        step_type = step.get("type")
        action = step.get("action")
        payload = step.get("payload", {})

        if step_type == "keyboard":
            return {"type": "keyboard", "key": payload.get("key")}

        elif step_type == "mouse":
            return {
                "type": "mouse",
                "action": action,
                "position": (payload.get("x"), payload.get("y"))
            }

        elif step_type == "delay":
            await asyncio.sleep(payload.get("seconds", 1))
            return {"type": "delay", "seconds": payload.get("seconds", 1)}

        elif step_type == "edit":
            return {"type": "edit", "payload": payload}

        elif step_type == "format":
            return {"type": "format", "payload": payload}

        else:
            return {"type": "unknown", "message": f"Unknown step type: {step_type}"}

    async def start_recording(self) -> Dict[str, Any]:
        """Start recording a macro"""
        if self.is_recording:
            raise ValueError("Already recording")

        self.is_recording = True
        self.current_recording = []
        self.recording_start_time = datetime.now()
        self.last_action_time = datetime.now()

        return {
            "success": True,
            "message": "Started recording macro",
            "timestamp": self.recording_start_time.isoformat()
        }

    async def stop_recording(self) -> Dict[str, Any]:
        """Stop recording a macro"""
        if not self.is_recording:
            raise ValueError("Not recording")

        self.is_recording = False
        recording_duration = (datetime.now() - self.recording_start_time).total_seconds()

        return {
            "success": True,
            "message": "Stopped recording macro",
            "steps_recorded": len(self.current_recording),
            "duration_seconds": recording_duration,
            "steps": self.current_recording
        }

    async def add_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """Add a step to the current recording"""
        if not self.is_recording:
            raise ValueError("Not recording")

        current_time = datetime.now()
        if self.last_action_time:
            delay = int((current_time - self.last_action_time).total_seconds() * 1000)
            step["delay"] = delay

        self.last_action_time = current_time
        self.current_recording.append(step)

        return {
            "success": True,
            "step_count": len(self.current_recording)
        }

    async def get_recording_status(self) -> Dict[str, Any]:
        """Get current recording status"""
        start = self.recording_start_time
        is_rec = self.is_recording
        duration = (
            (datetime.now() - start).total_seconds()
            if is_rec and start else 0
        )
        return {
            "is_recording": is_rec,
            "steps_recorded": len(self.current_recording),
            "start_time": start.isoformat() if start else None,
            "duration_seconds": duration
        }

    async def clear_recording(self) -> Dict[str, Any]:
        """Clear the current recording"""
        self.current_recording = []
        self.is_recording = False
        self.recording_start_time = None
        self.last_action_time = None

        return {
            "success": True,
            "message": "Recording cleared"
        }

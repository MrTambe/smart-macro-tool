import json
import os
from typing import List, Dict, Any, AsyncGenerator, Optional
import httpx
import openai
from anthropic import Anthropic

from app.core.config import settings

class AIService:
    """AI service for handling LLM interactions"""
    
    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.setup_clients()
    
    def setup_clients(self):
        """Setup AI clients based on provider"""
        if self.provider == "openai" and settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        elif self.provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def chat(self, message: str, context: Optional[List[dict]] = None, current_file: Optional[dict] = None) -> Dict[str, Any]:
        """Process a chat message"""
        try:
            # Build system prompt
            system_prompt = self._build_system_prompt(current_file)
            
            # Build messages
            messages = [{"role": "system", "content": system_prompt}]
            
            if context:
                for msg in context:
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            messages.append({"role": "user", "content": message})
            
            # Get response based on provider
            if self.provider == "ollama":
                response = await self._chat_ollama(messages)
            elif self.provider == "openai":
                response = await self._chat_openai(messages)
            elif self.provider == "anthropic":
                response = await self._chat_anthropic(messages)
            else:
                raise ValueError(f"Unknown AI provider: {self.provider}")
            
            # Parse response for actions
            parsed_response = self._parse_response(response)
            return parsed_response
            
        except Exception as e:
            raise Exception(f"AI chat error: {str(e)}")
    
    def _build_system_prompt(self, current_file: Optional[dict] = None) -> str:
        """Build the system prompt"""
        prompt = """You are an AI assistant for Smart Macro Tool, an intelligent automation system.

Your role is to help users with:
1. File editing and formatting
2. Data analysis and manipulation
3. Creating and managing macros
4. Content generation and improvement

CRITICAL RULES:
- ALWAYS ask for user approval before making any changes to files
- Explain what you plan to do in clear, simple terms
- Provide step-by-step explanations
- Never execute destructive operations without explicit confirmation
- If you're unsure about something, ask the user for clarification

When you need to perform an action, format your response like this:

I'll help you with [task]. Here's what I plan to do:
1. [Step 1]
2. [Step 2]

[ACTIONS]
- type: "edit" | "format" | "create" | "delete" | "macro"
  description: "Clear description of the action"
  payload: { action-specific data }

Would you like me to proceed?"""

        if current_file:
            prompt += f"\n\nCurrent file: {current_file.get('name', 'Unknown')}"
            prompt += f"\nFile type: {current_file.get('extension', 'unknown')}"
        
        return prompt
    
    async def _chat_ollama(self, messages: List[Dict[str, str]]) -> str:
        """Chat using Ollama (local LLM)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")
    
    async def _chat_openai(self, messages: List[Dict[str, str]]) -> str:
        """Chat using OpenAI"""
        response = await openai.ChatCompletion.acreate(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    
    async def _chat_anthropic(self, messages: List[Dict[str, str]]) -> str:
        """Chat using Anthropic Claude"""
        # Convert messages to Claude format
        system_msg = next((m for m in messages if m["role"] == "system"), None)
        conversation = [m for m in messages if m["role"] != "system"]
        
        response = self.anthropic_client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2000,
            system=system_msg["content"] if system_msg else None,
            messages=conversation
        )
        return response.content[0].text
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response to extract actions"""
        # Check for [ACTIONS] section
        if "[ACTIONS]" in response:
            parts = response.split("[ACTIONS]")
            message = parts[0].strip()
            actions_text = parts[1].strip() if len(parts) > 1 else ""
            
            # Parse actions (simplified YAML-like parsing)
            actions = self._parse_actions(actions_text)
            
            return {
                "message": message,
                "actions": actions,
                "status": "pending"
            }
        
        return {
            "message": response,
            "actions": [],
            "status": "completed"
        }
    
    def _parse_actions(self, actions_text: str) -> List[Dict[str, Any]]:
        """Parse actions from text"""
        actions = []
        current_action = None
        
        for line in actions_text.split('\n'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if line.startswith('- type:'):
                if current_action:
                    actions.append(current_action)
                current_action = {"id": f"action_{len(actions)}"}
                current_action["type"] = line.split(':', 1)[1].strip().strip('"').strip("'")
            elif line.startswith('description:') and current_action:
                current_action["description"] = line.split(':', 1)[1].strip().strip('"').strip("'")
            elif line.startswith('payload:') and current_action:
                current_action["payload"] = {}
            elif ':' in line and current_action and current_action.get("payload") is not None:
                key, value = line.split(':', 1)
                current_action["payload"][key.strip()] = value.strip().strip('"').strip("'")
        
        if current_action:
            actions.append(current_action)
        
        return actions
    
    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an AI action"""
        action_type = action.get("type")
        
        if action_type == "edit":
            return await self._execute_edit_action(action)
        elif action_type == "format":
            return await self._execute_format_action(action)
        elif action_type == "create":
            return await self._execute_create_action(action)
        elif action_type == "delete":
            return await self._execute_delete_action(action)
        elif action_type == "macro":
            return await self._execute_macro_action(action)
        else:
            raise ValueError(f"Unknown action type: {action_type}")
    
    async def _execute_edit_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an edit action"""
        # Implementation depends on specific edit requirements
        return {"success": True, "message": "Edit action executed"}
    
    async def _execute_format_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a format action"""
        return {"success": True, "message": "Format action executed"}
    
    async def _execute_create_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a create action"""
        return {"success": True, "message": "Create action executed"}
    
    async def _execute_delete_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a delete action"""
        return {"success": True, "message": "Delete action executed"}
    
    async def _execute_macro_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a macro action"""
        return {"success": True, "message": "Macro action executed"}
    
    async def stream_chat(self, message: str, context: Optional[List[dict]] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat responses"""
        # Placeholder for streaming implementation
        yield {"type": "token", "content": "Streaming not implemented yet"}
    
    async def analyze_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze data using AI"""
        prompt = f"""Analyze the following data and provide insights:

Data: {json.dumps(data, indent=2)}

Please provide:
1. Summary statistics
2. Key patterns or trends
3. Notable observations
4. Recommendations"""

        messages = [
            {"role": "system", "content": "You are a data analysis expert."},
            {"role": "user", "content": prompt}
        ]
        
        if self.provider == "ollama":
            response = await self._chat_ollama(messages)
        elif self.provider == "openai":
            response = await self._chat_openai(messages)
        elif self.provider == "anthropic":
            response = await self._chat_anthropic(messages)
        else:
            response = "Analysis not available"
        
        return {
            "analysis": response,
            "data_summary": {
                "rows": len(data.get("rows", [])),
                "columns": len(data.get("headers", []))
            }
        }
    
    async def generate_content(self, prompt: str, type: str = "text", context: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate content using AI"""
        type_prompts = {
            "text": "Generate text content based on the following:",
            "summary": "Summarize the following content:",
            "improve": "Improve and polish the following content:",
            "expand": "Expand on the following content with more detail:"
        }
        
        full_prompt = f"{type_prompts.get(type, type_prompts['text'])}\n\n{prompt}"
        
        messages = [
            {"role": "system", "content": "You are a helpful content generation assistant."},
            {"role": "user", "content": full_prompt}
        ]
        
        if self.provider == "ollama":
            response = await self._chat_ollama(messages)
        elif self.provider == "openai":
            response = await self._chat_openai(messages)
        elif self.provider == "anthropic":
            response = await self._chat_anthropic(messages)
        else:
            response = "Content generation not available"
        
        return {
            "content": response,
            "type": type
        }
    
    async def format_content(self, content: str, format_type: str = "improve") -> Dict[str, Any]:
        """Format content using AI"""
        return await self.generate_content(content, type=format_type)
    
    async def list_models(self) -> List[Dict[str, str]]:
        """List available AI models"""
        if self.provider == "ollama":
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                    data = response.json()
                    return [{"id": m["name"], "name": m["name"]} for m in data.get("models", [])]
            except:
                return [{"id": settings.OLLAMA_MODEL, "name": settings.OLLAMA_MODEL}]
        elif self.provider == "openai":
            return [
                {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"},
                {"id": "gpt-4", "name": "GPT-4"}
            ]
        elif self.provider == "anthropic":
            return [
                {"id": "claude-instant-1", "name": "Claude Instant"},
                {"id": "claude-2", "name": "Claude 2"}
            ]
        return []

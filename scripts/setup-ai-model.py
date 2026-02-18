#!/usr/bin/env python3
"""
AI Model Setup Script
Automatically downloads AI model on first run
"""

import os
import sys
import subprocess
import time

def check_ollama_installed():
    """Check if Ollama is installed"""
    try:
        result = subprocess.run(
            ["ollama", "--version"],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False

def install_ollama():
    """Install Ollama"""
    print("📥 Installing Ollama...")
    
    if sys.platform == "win32":
        # Windows install
        print("   Download from: https://ollama.com/download/windows")
        print("   Or run in PowerShell:")
        print("   >irm https://ollama.com/install.ps1 | iex")
        return False
    else:
        # Linux/Mac
        subprocess.run(
            ["curl", "-fsSL", "https://ollama.com/install.sh", "|", "sh"],
            shell=True
        )
        return True

def download_model(model_name="llama3.2"):
    """Download the AI model"""
    print(f"\n🤖 Downloading AI model: {model_name}")
    print("   This may take a few minutes on first run...")
    
    try:
        result = subprocess.run(
            ["ollama", "pull", model_name],
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes timeout
        )
        
        if result.returncode == 0:
            print(f"   ✅ {model_name} downloaded successfully!")
            return True
        else:
            print(f"   ❌ Download failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("   ❌ Download timed out")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def check_model_exists(model_name="llama3.2"):
    """Check if model is already downloaded"""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True
        )
        return model_name in result.stdout
    except:
        return False

def main():
    print("=" * 50)
    print("🤖 Smart Macro Tool - AI Setup")
    print("=" * 50)
    
    # Check Ollama
    if not check_ollama_installed():
        print("\n❌ Ollama not found!")
        install_ollama()
        print("\n📌 Please install Ollama and run this script again")
        return False
    
    print("✅ Ollama is installed")
    
    # Check/Download model
    model_name = "llama3.2"
    
    if check_model_exists(model_name):
        print(f"✅ {model_name} is already downloaded")
    else:
        if not download_model(model_name):
            print("\n⚠️  Using cloud AI as fallback...")
            print("   Configure OpenRouter in app Settings")
    
    print("\n" + "=" * 50)
    print("✅ AI Setup Complete!")
    print("=" * 50)
    
    return True

if __name__ == "__main__":
    main()
    input("\nPress Enter to exit...")

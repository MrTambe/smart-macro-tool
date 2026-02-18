"""
Clean Architecture implementation for Excel processing application.

Architecture Layers:
1. Domain: Business entities and rules (innermost - no dependencies)
2. Application: Use cases and business logic (depends only on Domain)
3. Infrastructure: External implementations (DB, File system, parsers)
4. Interface: UI/API layer (depends on Application)

Dependency Rule: Dependencies point inward. Inner layers know nothing about outer layers.
"""

__version__ = "1.0.0"
__author__ = "Smart Macro Tool Team"

# ANONYMOUS X WhatsApp Bot

## Overview

ANONYMOUS X is a feature-rich WhatsApp bot built with Node.js that provides a comprehensive suite of commands and services. The bot leverages the Baileys library for WhatsApp Web API integration and offers various functionalities including AI services, media downloading, games, utility tools, and group administration features. The bot is designed to be modular, scalable, and easy to extend with new features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Bot Architecture
The system follows a modular, service-oriented architecture with clear separation of concerns:

**Main Bot Class (AnonymousXBot)**
- Handles WhatsApp connection management using Baileys library
- Manages authentication state with multi-file persistence
- Coordinates message handling and command processing
- Implements connection recovery and error handling

**Handler Layer**
- `MessageHandler`: Processes incoming WhatsApp messages, extracts metadata, and routes commands
- `CommandHandler`: Acts as a central dispatcher for all bot commands and manages command aliases
- Implements rate limiting, cooldown management, and permission checking

**Service Layer**
The bot uses a service-oriented architecture with specialized services:
- `AIService`: Handles AI-powered features using OpenAI GPT-5 model
- `DownloaderService`: Manages media downloads from various platforms (YouTube, Instagram, TikTok, Twitter)
- `GamesService`: Implements interactive games like Tic-Tac-Toe, trivia, and hangman
- `UtilsService`: Provides utility functions like sticker creation, weather info, and image processing
- `AdminService`: Handles group administration features (kick, mute, warnings)
- `EconomyService`: Manages virtual economy system with user balances and daily rewards
- `FunService`: Provides entertainment features like jokes, memes, and quotes

### Data Management
**File-based Storage Strategy**
- User data stored in JSON files (`./data/users.json`, `./data/groups.json`)
- Authentication state persisted in `./auth_info` directory
- Configuration centralized in `./config/settings.json`
- Temporary files managed in `./temp` directory

**In-Memory Caching**
- Active game states stored in memory maps
- User cooldowns and rate limiting data cached temporarily
- Message statistics and bot state maintained in memory

### Command System
**Flexible Command Registration**
- Commands registered in `CommandHandler` with automatic alias support
- Prefix-based command detection (configurable, default: ".")
- Parameter parsing and validation built into each service method
- Permission-based command access control

**Rate Limiting and Cooldowns**
- Per-user command cooldowns to prevent spam
- Daily usage limits for resource-intensive features (AI, downloads)
- Concurrent download limits to manage server resources

### Media Processing
**Image and Video Handling**
- Sharp library for image processing and sticker creation
- YTDL-core for YouTube video downloads with quality selection
- Automatic format conversion and size optimization
- File size limits and format validation for security

### Error Handling and Logging
**Robust Error Management**
- Try-catch blocks in all async operations
- Graceful fallbacks for API failures
- Message statistics tracking for monitoring
- Console logging for debugging and monitoring

### Security and Permissions
**Multi-level Access Control**
- Owner-level commands for bot administration
- Group admin permissions for moderation features
- User-level restrictions and cooldowns
- Input validation and sanitization

## External Dependencies

### WhatsApp Integration
- **@whiskeysockets/baileys**: Primary library for WhatsApp Web API integration
- **@hapi/boom**: Error handling for WebSocket connections
- **qrcode-terminal**: QR code display for initial authentication

### AI Services
- **OpenAI API**: Powers GPT-5 integration for conversational AI features
- Configured for chat completions with system prompts and token limits
- Fallback handling for API rate limits and errors

### Media Processing
- **ytdl-core**: YouTube video downloading and metadata extraction
- **sharp**: High-performance image processing for stickers and image manipulation
- **axios**: HTTP client for API requests and media downloads

### Utility Libraries
- **fs-extra**: Enhanced file system operations with promise support
- **path**: File path manipulation utilities

### Planned Integration Points
The architecture supports easy integration of additional services:
- Database systems (the modular data layer can be extended to support databases)
- Additional AI providers (Gemini, Copilot, Perplexity as mentioned in commands)
- More social media platforms for downloading
- External APIs for weather, news, and other data sources

The bot's modular design allows for easy feature additions and service integrations without affecting the core architecture.
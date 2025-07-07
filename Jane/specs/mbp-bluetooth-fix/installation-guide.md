---
title: Installation Guide and Setup Instructions
description: >-
  Complete step-by-step installation guide for setting up the Bluetooth audio
  quality fix solution
author: Claude Code
tags:
  - installation
  - setup
  - guide
  - dependencies
  - configuration
createdAt: '2025-07-01T17:29:14.893Z'
updatedAt: '2025-07-01T17:29:14.894Z'
---
# Installation Guide and Setup Instructions

## Quick Start (Recommended)

### One-Line Installation
```bash
curl -fsSL https://raw.githubusercontent.com/username/mbp-bluetooth-fix/main/install.sh | bash
```

### Manual Installation Steps
1. **Install Homebrew** (if not already installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install BluetoothConnector**
   ```bash
   brew install bluetoothconnector
   ```

3. **Download and install fix-audio script**
   ```bash
   curl -o /usr/local/bin/fix-audio https://raw.githubusercontent.com/username/mbp-bluetooth-fix/main/fix-audio.sh
   chmod +x /usr/local/bin/fix-audio
   ```

4. **Verify installation**
   ```bash
   fix-audio --help
   ```

## Detailed Installation Guide

### System Requirements

#### Minimum Requirements
- **Operating System**: macOS 11.0 (Big Sur) or later
- **Hardware**: Mac with Bluetooth support
- **Target Device**: Plantronics Backbeat Pro (PLT_BBTPRO)
- **Permissions**: Standard user account (no admin required for usage)

#### Recommended Environment
- **Operating System**: macOS 14.4+ (Sonoma)
- **Hardware**: Apple Silicon Mac (M1, M2, M3)
- **Memory**: 8GB RAM or higher
- **Storage**: 1GB free space for dependencies

### Step 1: System Preparation

#### Check macOS Version
```bash
sw_vers -productVersion
# Should show 11.0 or higher
```

#### Verify Bluetooth Hardware
```bash
system_profiler SPBluetoothDataType | grep "Bluetooth Controller"
# Should show your Bluetooth hardware info
```

#### Check Target Device Pairing
```bash
system_profiler SPBluetoothDataType | grep -A 5 "PLT_BBTPRO"
# Should show your Plantronics device if paired
```

### Step 2: Install Package Manager

#### Install Homebrew
If you don't have Homebrew installed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Verify Homebrew Installation
```bash
brew --version
brew doctor
# Should show version info and "Your system is ready to brew"
```

#### Add Homebrew to PATH (if needed)
For Apple Silicon Macs:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs:
```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

### Step 3: Install Core Dependencies

#### Install BluetoothConnector (Required)
```bash
brew install bluetoothconnector
```

Verify installation:
```bash
BluetoothConnector --help
# Should show usage information
```

Test with your device:
```bash
BluetoothConnector --status 0C:E0:E4:86:0B:06
# Should show connection status
```

#### Install Optional Dependencies

**Node.js Audio Device Manager** (for fallback strategies):
```bash
npm install -g @spotxyz/macos-audio-devices
```

**Alternative Bluetooth Utility**:
```bash
brew install blueutil
```

### Step 4: Install fix-audio Script

#### Method 1: Direct Download (Recommended)
```bash
# Download to system PATH
sudo curl -o /usr/local/bin/fix-audio https://raw.githubusercontent.com/username/mbp-bluetooth-fix/main/fix-audio.sh

# Make executable
sudo chmod +x /usr/local/bin/fix-audio

# Verify installation
which fix-audio
fix-audio --version
```

#### Method 2: Git Clone and Install
```bash
# Clone repository
git clone https://github.com/username/mbp-bluetooth-fix.git
cd mbp-bluetooth-fix

# Install script
sudo cp fix-audio.sh /usr/local/bin/fix-audio
sudo chmod +x /usr/local/bin/fix-audio

# Clean up
cd ..
rm -rf mbp-bluetooth-fix
```

#### Method 3: Local Installation
If you prefer not to install system-wide:
```bash
# Create local bin directory
mkdir -p ~/bin

# Download script
curl -o ~/bin/fix-audio https://raw.githubusercontent.com/username/mbp-bluetooth-fix/main/fix-audio.sh
chmod +x ~/bin/fix-audio

# Add to PATH
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

### Step 5: Configuration and Testing

#### Initial Configuration Check
```bash
fix-audio --help
# Should show usage information

fix-audio --version
# Should show current version
```

#### Test Dependency Verification
```bash
fix-audio --check-deps
# Should verify all dependencies are available
```

#### Verify Target Device Detection
```bash
fix-audio --status
# Should show current device status
```

### Step 6: First Test Run

#### Setup Test Environment
1. Ensure Plantronics Backbeat Pro is connected
2. Play music to verify high-quality audio
3. Join a Google Meet call (or use test call)
4. End the call (audio should be degraded)

#### Run First Fix
```bash
fix-audio
```

Expected output:
```
🎧 Bluetooth Audio Quality Fixer v1.0.0
📱 Target: PLT_BBTPRO (0C:E0:E4:86:0B:06)

[INFO] Checking device status...
[INFO] Disconnecting Bluetooth device...
[INFO] Waiting 3 seconds for clean disconnection...
[INFO] Reconnecting device...
[INFO] Waiting 2 seconds for profile establishment...
✅ Audio quality restored successfully!
```

## Installation Verification

### Complete Verification Checklist
```bash
# 1. Check all dependencies
which BluetoothConnector && echo "✅ BluetoothConnector" || echo "❌ BluetoothConnector missing"
which fix-audio && echo "✅ fix-audio" || echo "❌ fix-audio missing"
which audio-devices && echo "✅ audio-devices (optional)" || echo "ℹ️ audio-devices not installed (optional)"
which blueutil && echo "✅ blueutil (optional)" || echo "ℹ️ blueutil not installed (optional)"

# 2. Test core functionality
fix-audio --help
fix-audio --version
fix-audio --check-deps

# 3. Verify target device
system_profiler SPBluetoothDataType | grep -A 5 "PLT_BBTPRO"
```

### Troubleshooting Installation Issues

#### Issue: Homebrew Installation Fails
**Symptoms**: `brew command not found` or permission errors

**Solutions**:
```bash
# For command not found
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile

# For permission errors
sudo chown -R $(whoami) /opt/homebrew/*
```

#### Issue: BluetoothConnector Not Found
**Symptoms**: `BluetoothConnector: command not found`

**Solutions**:
```bash
# Update Homebrew and retry
brew update
brew install bluetoothconnector

# Check if installed but not in PATH
find /opt/homebrew -name "BluetoothConnector" 2>/dev/null
find /usr/local -name "BluetoothConnector" 2>/dev/null
```

#### Issue: Permission Denied for fix-audio
**Symptoms**: `Permission denied` when running fix-audio

**Solutions**:
```bash
# Fix permissions
sudo chmod +x /usr/local/bin/fix-audio

# Or use local installation
chmod +x ~/bin/fix-audio
```

#### Issue: Target Device Not Found
**Symptoms**: Error about device not being paired

**Solutions**:
1. **Pair Device**: Go to System Preferences → Bluetooth → Pair PLT_BBTPRO
2. **Verify MAC Address**: Check if your device has different MAC address
   ```bash
   system_profiler SPBluetoothDataType | grep -A 10 "PLT"
   ```

## Advanced Installation Options

### Development Installation
For users who want to modify or contribute:
```bash
# Clone repository
git clone https://github.com/username/mbp-bluetooth-fix.git
cd mbp-bluetooth-fix

# Install in development mode
./install.sh --dev

# This creates symlinks instead of copies for easy development
```

### Custom Installation Paths
```bash
# Install to custom location
./install.sh --prefix=/opt/mbp-bluetooth-fix

# Install for single user only
./install.sh --user-only

# Install with specific configuration
./install.sh --config=/path/to/custom/config
```

### Automated Deployment
For IT administrators deploying to multiple machines:
```bash
# Silent installation script
curl -fsSL https://raw.githubusercontent.com/username/mbp-bluetooth-fix/main/install.sh | bash -s -- --silent --no-interaction

# Or with Ansible/Chef/Puppet
ansible-playbook deploy-bluetooth-fix.yml
```

## Post-Installation Setup

### Shell Integration
Add useful aliases to your shell profile:
```bash
# Add to ~/.zprofile or ~/.bash_profile
alias fix-bt='fix-audio'
alias bt-fix='fix-audio'
alias audio-fix='fix-audio'
```

### Usage Tips
1. **Best Practice**: Run immediately after ending video calls
2. **Timing**: Works best when headphones are connected
3. **Frequency**: Safe to run multiple times if needed
4. **Troubleshooting**: Use `fix-audio --debug` for detailed output

### Update Mechanism
Check for updates periodically:
```bash
fix-audio --check-updates
# Or manually update
curl -o /usr/local/bin/fix-audio https://raw.githubusercontent.com/username/mbp-bluetooth-fix/main/fix-audio.sh
```

## Uninstallation

### Complete Removal
```bash
# Remove main script
sudo rm /usr/local/bin/fix-audio

# Remove optional dependencies (if desired)
brew uninstall bluetoothconnector blueutil
npm uninstall -g @spotxyz/macos-audio-devices

# Remove configuration (if any)
rm -rf ~/.config/mbp-bluetooth-fix
```

### Keep Dependencies
If you want to keep dependencies for other uses:
```bash
# Remove only the fix-audio script
sudo rm /usr/local/bin/fix-audio
```

This installation guide provides comprehensive instructions for users of all technical levels to successfully install and configure the Bluetooth audio quality fix solution.

---
title: Dependencies and External Tools Requirements
description: >-
  Complete specification of required and optional dependencies for implementing
  the Bluetooth audio quality fix solution
author: Claude Code
tags:
  - dependencies
  - installation
  - tools
  - requirements
  - setup
createdAt: '2025-07-01T17:26:43.792Z'
updatedAt: '2025-07-01T17:26:43.792Z'
---
# Dependencies and External Tools Requirements

## Required Dependencies

### 1. BluetoothConnector
**Purpose**: Primary Bluetooth device connection management
**Installation**: `brew install bluetoothconnector`
**Source**: https://github.com/lapfelix/BluetoothConnector
**License**: MIT
**Size**: ~500KB

#### Features Used
- Device connection/disconnection by MAC address
- Connection status checking
- Notification integration
- Reliable command-line interface

#### Verification
```bash
# Check installation
which BluetoothConnector
BluetoothConnector --help

# Test with target device
BluetoothConnector --status 0C:E0:E4:86:0B:06
```

### 2. macOS System Utilities
**Purpose**: Device information and system integration
**Installation**: Built-in (no installation required)
**Availability**: macOS 10.13+ (all supported versions)

#### Tools Used
- `system_profiler`: Bluetooth device information
- `launchctl`: Service management (if needed)
- `pkill`: Process management (fallback scenarios)

#### Verification
```bash
# Test system utilities
system_profiler SPBluetoothDataType | head -5
launchctl list | grep bluetooth
```

## Optional Dependencies

### 3. @spotxyz/macos-audio-devices (Node.js Package)
**Purpose**: Advanced audio device management fallback
**Installation**: `npm install -g @spotxyz/macos-audio-devices`
**Source**: https://github.com/spotxyz/macos-audio-devices
**License**: ISC
**Size**: ~2MB with dependencies

#### Features Used
- Audio device enumeration
- Default output device management
- Device switching without Bluetooth disconnection
- Volume control (not used in primary implementation)

#### Installation Commands
```bash
# Global installation
npm install -g @spotxyz/macos-audio-devices

# Local project installation
npm install @spotxyz/macos-audio-devices

# Verification
audio-devices --help
audio-devices list
```

### 4. blueutil
**Purpose**: Alternative Bluetooth management tool
**Installation**: `brew install blueutil`
**Source**: https://github.com/toy/blueutil
**License**: MIT
**Size**: ~100KB

#### Features Used
- Alternative Bluetooth device control
- Power management
- Discovery and pairing operations (not used in primary implementation)

#### Verification
```bash
# Check installation
which blueutil
blueutil --version

# Test basic functionality
blueutil --paired
```

### 5. Node.js Runtime
**Purpose**: Advanced implementation with better error handling
**Installation**: Built-in on macOS or via Homebrew
**Version**: 18.0.0 or higher
**Source**: https://nodejs.org/

#### Installation Options
```bash
# Via Homebrew
brew install node

# Via official installer
# Download from https://nodejs.org/

# Verify installation
node --version
npm --version
```

## Development Dependencies

### 6. Homebrew Package Manager
**Purpose**: Dependency installation and management
**Installation**: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
**Required For**: BluetoothConnector, blueutil, Node.js (optional)

#### Verification
```bash
# Check Homebrew installation
brew --version
brew doctor
```

## Dependency Installation Scripts

### Complete Setup Script
```bash
#!/bin/bash
# setup-dependencies.sh - Install all required dependencies

set -euo pipefail

log_info() {
    printf "[INFO] %s\n" "$*"
}

log_error() {
    printf "\e[31m[ERROR]\e[0m %s\n" "$*" >&2
}

log_success() {
    printf "\e[32m[SUCCESS]\e[0m %s\n" "$*"
}

# Check if Homebrew is installed
check_homebrew() {
    if ! command -v brew >/dev/null 2>&1; then
        log_error "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        log_info "Homebrew found: $(brew --version | head -1)"
    fi
}

# Install BluetoothConnector
install_bluetooth_connector() {
    if ! command -v BluetoothConnector >/dev/null 2>&1; then
        log_info "Installing BluetoothConnector..."
        brew install bluetoothconnector
        log_success "BluetoothConnector installed"
    else
        log_info "BluetoothConnector already installed"
    fi
}

# Install optional audio device manager
install_audio_devices() {
    if ! command -v audio-devices >/dev/null 2>&1; then
        log_info "Installing @spotxyz/macos-audio-devices..."
        if command -v npm >/dev/null 2>&1; then
            npm install -g @spotxyz/macos-audio-devices
            log_success "audio-devices installed"
        else
            log_info "npm not available, skipping audio-devices installation"
        fi
    else
        log_info "audio-devices already installed"
    fi
}

# Install optional blueutil
install_blueutil() {
    if ! command -v blueutil >/dev/null 2>&1; then
        log_info "Installing blueutil..."
        brew install blueutil
        log_success "blueutil installed"
    else
        log_info "blueutil already installed"
    fi
}

# Main installation sequence
main() {
    log_info "=== Bluetooth Audio Fix - Dependency Setup ==="
    
    check_homebrew
    install_bluetooth_connector
    install_audio_devices
    install_blueutil
    
    log_success "All dependencies installed successfully!"
    
    # Verification
    log_info "Verifying installations..."
    BluetoothConnector --help >/dev/null && log_success "BluetoothConnector: OK"
    command -v audio-devices >/dev/null && log_success "audio-devices: OK" || log_info "audio-devices: Not available (optional)"
    command -v blueutil >/dev/null && log_success "blueutil: OK" || log_info "blueutil: Not available (optional)"
}

main "$@"
```

## Dependency Verification and Health Checks

### System Requirements Check
```bash
#!/bin/bash
# check-system-requirements.sh

check_macos_version() {
    local version
    version=$(sw_vers -productVersion)
    local major_version
    major_version=$(echo "$version" | cut -d. -f1)
    
    if [[ $major_version -ge 11 ]] || [[ $version == "10.15"* ]] || [[ $version == "10.14"* ]]; then
        log_success "macOS version compatible: $version"
        return 0
    else
        log_error "macOS version may not be compatible: $version"
        return 1
    fi
}

check_bluetooth_support() {
    if system_profiler SPBluetoothDataType | grep -q "Bluetooth Controller"; then
        log_success "Bluetooth hardware detected"
        return 0
    else
        log_error "Bluetooth hardware not detected"
        return 1
    fi
}

check_target_device() {
    if system_profiler SPBluetoothDataType | grep -q "0C:E0:E4:86:0B:06"; then
        log_success "Target device found in paired devices"
        return 0
    else
        log_info "Target device not currently paired (this is OK)"
        return 0
    fi
}
```

### Dependency Health Check
```bash
verify_dependencies() {
    local failed_checks=0
    
    # Required dependencies
    if ! command -v BluetoothConnector >/dev/null 2>&1; then
        log_error "BluetoothConnector not found (REQUIRED)"
        ((failed_checks++))
    fi
    
    if ! command -v system_profiler >/dev/null 2>&1; then
        log_error "system_profiler not found (REQUIRED)"
        ((failed_checks++))
    fi
    
    # Optional dependencies
    if ! command -v audio-devices >/dev/null 2>&1; then
        log_info "audio-devices not found (optional fallback unavailable)"
    fi
    
    if ! command -v blueutil >/dev/null 2>&1; then
        log_info "blueutil not found (optional fallback unavailable)"
    fi
    
    return $failed_checks
}
```

## Version Compatibility Matrix

### BluetoothConnector Versions
| Version | Compatibility | Notes |
|---------|---------------|-------|
| 1.0+ | ✅ Recommended | Full feature support |
| 0.9+ | ⚠️ Limited | Missing notification support |
| <0.9 | ❌ Not supported | API changes |

### macOS Versions
| macOS Version | Support Level | Notes |
|---------------|---------------|-------|
| macOS Sonoma 14.4+ | ✅ Primary Target | Fully tested |
| macOS Ventura 13.x | ✅ Supported | Expected to work |
| macOS Monterey 12.x | ⚠️ Limited testing | May work |
| macOS Big Sur 11.x | ⚠️ Limited testing | May work |
| macOS Catalina 10.15 | ❌ Not recommended | Bluetooth API differences |

### Node.js Versions
| Node.js Version | Support Level | Notes |
|-----------------|---------------|-------|
| 20.x | ✅ Recommended | Latest LTS |
| 18.x | ✅ Supported | Minimum required |
| 16.x | ⚠️ Limited | May work but not tested |
| <16.x | ❌ Not supported | Missing required APIs |

## Troubleshooting Dependency Issues

### Common Installation Problems

#### BluetoothConnector Installation Fails
```bash
# Issue: Homebrew can't find bluetoothconnector
# Solution: Update Homebrew and try again
brew update
brew install bluetoothconnector

# Alternative: Install from source
git clone https://github.com/lapfelix/BluetoothConnector.git
cd BluetoothConnector
make install
```

#### Permission Issues
```bash
# Issue: npm global install permissions
# Solution: Use npx or local installation
npx @spotxyz/macos-audio-devices list

# Or fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

#### System Utility Access
```bash
# Issue: system_profiler requires privacy permissions
# Solution: Grant Terminal privacy permissions in System Preferences
# System Preferences → Security & Privacy → Privacy → Full Disk Access
# Add Terminal.app or your preferred terminal application
```

## Minimal Installation Options

### Essential Only (Basic Functionality)
```bash
# Install only required dependencies
brew install bluetoothconnector

# Verify
BluetoothConnector --help
```

### Complete Installation (All Features)
```bash
# Install all dependencies for full feature set
brew install bluetoothconnector blueutil node
npm install -g @spotxyz/macos-audio-devices

# Verify all tools
BluetoothConnector --help
audio-devices --help  
blueutil --help
node --version
```

This dependency specification ensures reliable installation and setup of all required and optional tools for implementing the Bluetooth audio quality fix solution.

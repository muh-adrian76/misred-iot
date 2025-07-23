# PowerShell script untuk install Chrome dependencies pada Windows/Linux VPS
# Usage: .\install-chrome-deps.ps1

Write-Host "🔍 Checking operating system..." -ForegroundColor Cyan

if ($IsWindows -or $env:OS -eq "Windows_NT") {
    Write-Host "✅ Windows detected - Chrome dependencies are typically pre-installed" -ForegroundColor Green
    
    # Check if Chrome is installed
    $chromeExe = Get-Command chrome -ErrorAction SilentlyContinue
    $chromeExe2 = Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe"
    $chromeExe3 = Test-Path "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    
    if ($chromeExe -or $chromeExe2 -or $chromeExe3) {
        Write-Host "✅ Google Chrome found on system" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Google Chrome not found. Consider installing Chrome for better compatibility." -ForegroundColor Yellow
        Write-Host "📥 Download from: https://www.google.com/chrome/" -ForegroundColor Blue
    }
    
    # Check if Edge is available as fallback
    $edgeExe = Get-Command msedge -ErrorAction SilentlyContinue
    if ($edgeExe) {
        Write-Host "✅ Microsoft Edge found as fallback browser" -ForegroundColor Green
    }
    
} elseif ($IsLinux) {
    Write-Host "🐧 Linux detected - Installing Chrome dependencies..." -ForegroundColor Yellow
    
    # Check if running as root
    if ((id -u) -eq 0) {
        Write-Host "✅ Running as root - proceeding with installation" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not running as root. You may need to use 'sudo' for some commands." -ForegroundColor Yellow
    }
    
    # Update package list
    Write-Host "📦 Updating package list..." -ForegroundColor Cyan
    try {
        if (Get-Command apt-get -ErrorAction SilentlyContinue) {
            # Ubuntu/Debian
            Write-Host "🔄 Using apt package manager..." -ForegroundColor Blue
            apt-get update
            
            # Install Chrome dependencies
            Write-Host "📥 Installing Chrome dependencies..." -ForegroundColor Cyan
            $packages = @(
                "wget", "gnupg", "ca-certificates", "fonts-liberation",
                "libappindicator3-1", "libasound2", "libatk-bridge2.0-0",
                "libatk1.0-0", "libc6", "libcairo2", "libcups2", "libdbus-1-3",
                "libexpat1", "libfontconfig1", "libgcc1", "libgconf-2-4",
                "libgdk-pixbuf2.0-0", "libglib2.0-0", "libgtk-3-0", "libnspr4",
                "libnss3", "libpango-1.0-0", "libpangocairo-1.0-0", "libstdc++6",
                "libx11-6", "libx11-xcb1", "libxcb1", "libxcomposite1",
                "libxcursor1", "libxdamage1", "libxext6", "libxfixes3",
                "libxi6", "libxrandr2", "libxrender1", "libxss1", "libxtst6",
                "lsb-release", "xdg-utils"
            )
            
            foreach ($package in $packages) {
                Write-Host "  Installing $package..." -ForegroundColor Gray
                apt-get install -y $package
            }
            
            # Install Google Chrome
            Write-Host "🌐 Installing Google Chrome..." -ForegroundColor Cyan
            wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
            echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list
            apt-get update
            apt-get install -y google-chrome-stable
            
        } elseif (Get-Command yum -ErrorAction SilentlyContinue) {
            # CentOS/RHEL
            Write-Host "🔄 Using yum package manager..." -ForegroundColor Blue
            yum update -y
            
            # Install Chrome dependencies
            Write-Host "📥 Installing Chrome dependencies..." -ForegroundColor Cyan
            yum install -y wget gnupg ca-certificates liberation-fonts
            yum install -y alsa-lib atk cairo cups-libs dbus-glib expat fontconfig
            yum install -y GConf2 gdk-pixbuf2 glib2 gtk3 nspr nss pango
            yum install -y libX11 libXcomposite libXcursor libXdamage libXext
            yum install -y libXfixes libXi libXrandr libXrender libXScrnSaver libXtst
            
            # Install Google Chrome
            Write-Host "🌐 Installing Google Chrome..." -ForegroundColor Cyan
            wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | rpm --import -
            echo -e "[google-chrome]\nname=google-chrome\nbaseurl=http://dl.google.com/linux/chrome/rpm/stable/x86_64\nenabled=1\ngpgcheck=1\ngpgkey=https://dl.google.com/linux/linux_signing_key.pub" > /etc/yum.repos.d/google-chrome.repo
            yum install -y google-chrome-stable
            
        } else {
            Write-Host "❌ Unsupported package manager. Please install manually." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Chrome dependencies installed successfully!" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error installing dependencies: $_" -ForegroundColor Red
        exit 1
    }
    
} else {
    Write-Host "❌ Unsupported operating system" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Installation completed!" -ForegroundColor Green
Write-Host "ℹ️  You can now restart your Node.js application" -ForegroundColor Blue
Write-Host "📋 To test WhatsApp service:" -ForegroundColor Cyan
Write-Host "   1. Restart your server: npm run dev" -ForegroundColor Gray
Write-Host "   2. Check server logs for QR code" -ForegroundColor Gray
Write-Host "   3. Or use the admin panel to restart WhatsApp service" -ForegroundColor Gray

#!/bin/bash

# Install WhatsApp Web Dependencies for Linux VPS
# Script untuk menginstall dependencies yang dibutuhkan oleh Puppeteer/Chrome

echo "📦 Installing WhatsApp Web dependencies for Linux VPS..."
echo "=================================================="

# Update package list
echo "🔄 Updating package list..."
sudo apt-get update

# Install wget and essential tools
echo "🔧 Installing essential tools..."
sudo apt-get install -y wget gnupg ca-certificates curl

# Install Chrome/Chromium dependencies
echo "📱 Installing Chrome/Chromium dependencies..."
sudo apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    libxinerama1 \
    xdg-utils \
    lsb-release

# Optional: Install Google Chrome (recommended)
echo "🌐 Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Alternative: Install Chromium if Chrome fails
if ! command -v google-chrome-stable &> /dev/null; then
    echo "⚠️ Google Chrome installation failed, installing Chromium as fallback..."
    sudo apt-get install -y chromium-browser
fi

# Create a script to check installation
echo "🔍 Checking installation..."

# Check for Chrome/Chromium
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Google Chrome installed: $(google-chrome-stable --version)"
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium installed: $(chromium-browser --version)"
else
    echo "⚠️ No Chrome/Chromium found, but dependencies are installed"
fi

# Check for key dependencies
echo "🔍 Checking key dependencies..."
libs_to_check=(
    "/usr/lib/x86_64-linux-gnu/libatk-1.0.so.0"
    "/usr/lib/x86_64-linux-gnu/libnss3.so"
    "/usr/lib/x86_64-linux-gnu/libgtk-3.so.0"
)

for lib in "${libs_to_check[@]}"; do
    if [ -f "$lib" ]; then
        echo "✅ Found: $lib"
    else
        echo "❌ Missing: $lib"
    fi
done

echo ""
echo "🎉 Installation completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your Node.js application"
echo "   2. Check the server logs for WhatsApp Web initialization"
echo "   3. Scan the QR code that appears in the console"
echo ""
echo "💡 If you still have issues, you can disable WhatsApp by setting:"
echo "   DISABLE_WHATSAPP=true in your .env file"
echo ""
echo "🔗 For more troubleshooting, visit:"
echo "   https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md"

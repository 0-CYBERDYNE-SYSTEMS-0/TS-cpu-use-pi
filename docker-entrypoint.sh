#!/bin/bash
set -e

echo "Starting Xvfb..."
Xvfb :0 -screen 0 1024x768x24 &
sleep 2

echo "Starting Fluxbox..."
fluxbox &

echo "Starting VNC server..."
x11vnc -forever -usepw -display :0 -shared &

echo "Starting noVNC..."
/usr/share/novnc/utils/launch.sh --vnc localhost:5900 --listen 6080 &

echo "Starting Node application..."
exec npm run dev 
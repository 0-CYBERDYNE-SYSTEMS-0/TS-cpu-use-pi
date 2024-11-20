FROM ubuntu:22.04

# Pre-configure timezone
ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install Node.js 20.x
RUN apt-get update && apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

# Install required packages
RUN apt-get update && apt-get install -y \
    nodejs \
    firefox \
    xvfb \
    x11vnc \
    fluxbox \
    xdotool \
    python3 \
    python3-pip \
    novnc \
    websockify \
    && rm -rf /var/lib/apt/lists/*

# Set up display and VNC
ENV DISPLAY=:0
RUN mkdir -p ~/.vnc
RUN x11vnc -storepasswd mysecret ~/.vnc/passwd

# Create workspace
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Copy and setup entrypoint
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Configure Firefox for automation
RUN mkdir -p /root/.mozilla/firefox/automation/
COPY firefox.default /root/.mozilla/firefox/automation/prefs.js

EXPOSE 3000 5900 6080
ENTRYPOINT ["/docker-entrypoint.sh"] 
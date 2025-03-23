#!/bin/bash

usage() {
  echo "Usage: $0 [up|down|restart]"
  echo "  up      - Start development environment"
  echo "  down    - Stop development environment"
  echo "  restart - Restart development environment"
  exit 1
}

# Check command argument
if [ $# -ne 1 ]; then
  usage
fi

# Stop all Docker containers and restart Docker service
cleanup() {
  echo "Stopping all Docker containers..."
  docker-compose -f docker-compose.local.yml down 2>/dev/null
  docker-compose -f docker-compose.dev.yml down 2>/dev/null
  
  echo "Checking for any remaining Docker processes..."
  if pgrep -f "docker" > /dev/null; then
    echo "Restarting Docker service to clean up any lingering processes..."
    sudo service docker restart
    sleep 2
  fi
}

# Start development environment
start_dev() {
  echo "Starting development environment..."
  docker-compose -f docker-compose.dev.yml up -d --build
  
  echo "Waiting for services to initialize (30 seconds)..."
  sleep 30  # Allow React dev server to fully start
  
  echo ""
  echo "Development environment is now running!"
  echo "The metrical-tree-client is available at http://metricaltree.local"
  echo "You can also access it directly at http://localhost:3000"
  echo "Changes to the code will automatically reload in the browser"
}

# Process the command
case "$1" in
  up)
    cleanup
    start_dev
    ;;
  down)
    echo "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    ;;
  restart)
    cleanup
    start_dev
    ;;
  *)
    usage
    ;;
esac

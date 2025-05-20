#!/bin/bash
set -e

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log function
log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
  echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
  echo -e "${RED}[ERROR] $1${NC}" >&2
}

# Check disk usage
check_disk() {
  log "Checking disk usage..."
  DISK_USAGE=$(df -h / | grep -v Filesystem | awk '{print $5}' | tr -d '%')
  
  if [ "$DISK_USAGE" -gt 90 ]; then
    error "Disk usage is critical: ${DISK_USAGE}%"
    return 1
  elif [ "$DISK_USAGE" -gt 80 ]; then
    warn "Disk usage is high: ${DISK_USAGE}%"
    return 0
  else
    log "Disk usage is normal: ${DISK_USAGE}%"
    return 0
  fi
}

# Check memory usage
check_memory() {
  log "Checking memory usage..."
  MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
  
  if [ "$MEM_USAGE" -gt 90 ]; then
    error "Memory usage is critical: ${MEM_USAGE}%"
    return 1
  elif [ "$MEM_USAGE" -gt 80 ]; then
    warn "Memory usage is high: ${MEM_USAGE}%"
    return 0
  else
    log "Memory usage is normal: ${MEM_USAGE}%"
    return 0
  fi
}

# Check PM2 processes
check_pm2() {
  log "Checking PM2 processes..."
  
  if ! command -v pm2 &> /dev/null; then
    error "PM2 is not installed"
    return 1
  fi
  
  # Check if both frontend and backend are running
  FRONTEND_STATUS=$(pm2 jlist | grep -o '"name":"frontend".*"status":"online"' || echo "")
  BACKEND_STATUS=$(pm2 jlist | grep -o '"name":"backend".*"status":"online"' || echo "")
  
  if [ -z "$FRONTEND_STATUS" ]; then
    error "Frontend process is not running"
    return 1
  fi
  
  if [ -z "$BACKEND_STATUS" ]; then
    error "Backend process is not running"
    return 1
  fi
  
  log "All PM2 processes are running"
  return 0
}

# Check nginx status
check_nginx() {
  log "Checking Nginx status..."
  
  if ! systemctl is-active --quiet nginx; then
    error "Nginx is not running"
    return 1
  fi
  
  log "Nginx is running"
  return 0
}

# Check SSL certificate expiry
check_ssl() {
  log "Checking SSL certificate expiry..."
  
  DOMAIN="datizmo.com"
  CERT_FILE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
  
  if [ ! -f "$CERT_FILE" ]; then
    error "SSL certificate not found"
    return 1
  fi
  
  # Get expiry date in seconds since epoch
  EXPIRY=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
  EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
  NOW_EPOCH=$(date +%s)
  
  # Calculate days until expiry
  DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
  
  if [ "$DAYS_LEFT" -lt 7 ]; then
    error "SSL certificate expires in ${DAYS_LEFT} days"
    return 1
  elif [ "$DAYS_LEFT" -lt 14 ]; then
    warn "SSL certificate expires in ${DAYS_LEFT} days"
    return 0
  else
    log "SSL certificate valid for ${DAYS_LEFT} days"
    return 0
  fi
}

# Check frontend API response
check_api() {
  log "Checking API health..."
  
  response=$(curl -s -o /dev/null -w "%{http_code}" https://datizmo.com/api/health)
  
  if [ "$response" == "200" ]; then
    log "API is responding correctly"
    return 0
  else
    error "API returned HTTP code $response"
    return 1
  fi
}

# Check frontend website response
check_website() {
  log "Checking website health..."
  
  response=$(curl -s -o /dev/null -w "%{http_code}" https://datizmo.com)
  
  if [ "$response" == "200" ]; then
    log "Website is responding correctly"
    return 0
  else
    error "Website returned HTTP code $response"
    return 1
  fi
}

# Run all checks and collect results
run_checks() {
  ERRORS=0
  
  check_disk || ((ERRORS++))
  check_memory || ((ERRORS++))
  check_pm2 || ((ERRORS++))
  check_nginx || ((ERRORS++))
  check_ssl || ((ERRORS++))
  check_api || ((ERRORS++))
  check_website || ((ERRORS++))
  
  if [ "$ERRORS" -eq 0 ]; then
    log "All systems are operational!"
    return 0
  else
    error "${ERRORS} checks failed!"
    return 1
  fi
}

# Main execution
echo "==================================================="
echo "Datizmo Health Check - $(date)"
echo "==================================================="

run_checks
exit_code=$?

echo "==================================================="
echo "Health check completed with exit code: $exit_code"
echo "==================================================="

exit $exit_code 
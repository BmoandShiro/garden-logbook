#!/bin/bash

echo "UFW Safety Script Started - Will disable firewall every 5 minutes"
echo "To stop this script, press Ctrl+C and delete this file"

while true; do
    echo "Disabling UFW at $(date)"
    sudo ufw disable
    sleep 300  # 5 minutes
done 
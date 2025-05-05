#!/bin/bash

echo "Killing Next.js processes..."
pkill -f "next dev"

echo "Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "Restarting development server..."
npm run dev 

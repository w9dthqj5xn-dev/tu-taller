#!/bin/bash
set -euo pipefail

echo "🚀 Construyendo y desplegando a Netlify..."
netlify deploy --build --prod

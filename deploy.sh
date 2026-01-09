#!/bin/bash
# Script de deploy rápido

echo "🚀 Iniciando deploy a Netlify..."
git push origin main && netlify deploy --prod
echo "✅ Deploy completado!"

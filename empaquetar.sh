#!/bin/bash
# Script para empaquetar el juego para compartir

echo "🎮 Empaquetando Maze Game..."

# Build
npm run build

# Copiar instrucciones al dist
cp LEEME.txt dist/

# Crear ZIP
cd dist
zip -r ../maze-game-completo.zip . -x "*.DS_Store"
cd ..

echo ""
echo "✅ ¡Listo! El juego está en: maze-game-completo.zip"
echo ""
echo "📦 Para compartir:"
echo "   1. Envía maze-game-completo.zip a tus amigos"
echo "   2. Ellos deben descomprimirlo"
echo "   3. Seguir las instrucciones en LEEME.txt"
echo ""
echo "🌐 O mejor aún, súbelo a:"
echo "   - Netlify (arrastra dist/ a netlify.com)"
echo "   - GitHub Pages (npm run deploy)"
echo ""

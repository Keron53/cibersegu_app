#!/bin/bash

echo "🔧 Instalando dependencias para pyHanko..."

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor instala Python 3.8+"
    exit 1
fi

# Verificar si pip está instalado
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 no está instalado. Por favor instala pip"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando pyHanko y dependencias..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ pyHanko instalado correctamente"
    echo "🔍 Verificando instalación..."
    python3 -c "import pyhanko; print('✅ pyHanko importado correctamente')"
else
    echo "❌ Error instalando pyHanko"
    exit 1
fi

echo "🎉 Instalación completada. El sistema está listo para usar pyHanko." 
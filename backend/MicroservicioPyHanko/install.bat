@echo off
echo 🔧 Instalando dependencias para pyHanko...

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado. Por favor instala Python 3.8+
    pause
    exit /b 1
)

REM Verificar si pip está instalado
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip no está instalado. Por favor instala pip
    pause
    exit /b 1
)

REM Instalar dependencias
echo 📦 Instalando pyHanko y dependencias...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Error instalando pyHanko
    pause
    exit /b 1
) else (
    echo ✅ pyHanko instalado correctamente
    echo 🔍 Verificando instalación...
    python -c "import pyhanko; print('✅ pyHanko importado correctamente')"
)

echo 🎉 Instalación completada. El sistema está listo para usar pyHanko.
pause 
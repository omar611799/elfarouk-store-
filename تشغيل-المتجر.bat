@echo off
cd /d "%~dp0"
:: تشغيل السيرفر وفتح المتجر تلقائياً
start http://localhost:5174
npm run dev

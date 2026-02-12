@echo off
set "ANDROID_HOME=C:\Users\DELL PRECISION 5540\AppData\Local\Android\Sdk"
set "PATH=%PATH%;C:\Users\DELL PRECISION 5540\AppData\Local\Android\Sdk\platform-tools;C:\Users\DELL PRECISION 5540\AppData\Local\Android\Sdk\emulator"
echo Environment set. Running build...
call npx expo run:android

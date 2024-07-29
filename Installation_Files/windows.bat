@echo off

:: Run npm install in backend
cd ..\backend
npm install
cd ..

:: Run npm install in frontend
cd frontend
npm install
cd ..

:: Run npm install in frontend/recommender_system
cd frontend\recommender_system
npm install
cd ..\..

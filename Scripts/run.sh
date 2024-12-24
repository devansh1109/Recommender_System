# running frontend
(cd ../codmav_recommender_system/frontend/recommender_system; npm run dev &)
(cd ../codmav_recommender_system/backend; node server.js &)
eval "$(conda shell.bash hook)"
(cd ../codmav_recommender_system/backend; conda activate codmav_team2 && python app.py &)
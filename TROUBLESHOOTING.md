# Issues to be fixed:
`./run_app.sh 

> soccer-predictor@0.1.0 dev
> concurrently "PYTHONPATH=./backend ./.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000" "next dev"

[1]   ▲ Next.js 14.2.33
[1]   - Local:        http://localhost:3000
[1] 
[1]  ✓ Starting...
[0] INFO:     Started server process [28214]
[0] INFO:     Waiting for application startup.
[0] INFO:     Application startup complete.
[0] INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
[1]  ✓ Ready in 1819ms
[1]  ○ Compiling / ...
[1]  ✓ Compiled / in 1841ms (523 modules)
[1]  GET / 200 in 2248ms
[1]  ✓ Compiled in 356ms (268 modules)
[1]  ○ Compiling /predict ...
[1]  ✓ Compiled /predict in 3.4s (1557 modules)
[1]  ✓ Compiled /_not-found in 319ms (1560 modules)
[1]  POST /api/predict/head-to-head 404 in 422ms
[1]  ✓ Compiled /analytics in 283ms (1566 modules)
[0] INFO:     127.0.0.1:40072 - "GET /api/analytics/Premier%20League/Premier%20League_confusion_matrix HTTP/1.1" 404 Not Found
[0] INFO:     127.0.0.1:40088 - "GET /api/analytics/Premier%20League/Premier%20League_feature_importance HTTP/1.1" 404 Not Found
[0] INFO:     127.0.0.1:40100 - "GET /api/analytics/Premier%20League/Premier%20League_goals_distribution HTTP/1.1" 404 Not Found
[0] INFO:     127.0.0.1:40110 - "GET /api/analytics/Premier%20League/Premier%20League_result_distribution HTTP/1.1" 404 Not Found
[0] INFO:     127.0.0.1:40118 - "GET /api/analytics/Premier%20League/Premier%20League_season_trends HTTP/1.1" 404 Not Found`

- analytics page is not rendering the images. Edit the brief description on the analytics landing page to be more descriptive about what the analytics page is about instead of just saying select a league to view analytics.
- prediction results are still not being generated and displayed on the frontend, possibly due to the error above
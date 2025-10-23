# Updates I want to be made:

- Code style:
  - Please refactor the entire codebase to follow PEP 8 guidelines for Python code. Add this automatically so that whenever I push code to github, it checks and auto-formats the code to follow PEP 8 guidelines.
  - Ensure that docstrings are present for all functions and classes in the Python codebase.
  - Add type hints for all function signatures in the Python codebase.
- README.md:
  - The links in the table of contents do not work and direct the user to the contents they are supposed to. Please fix this
- New features:
  - I want a new tab that hosts predictions for all upcoming scheduled matches for the current 2025-2026 season across all leagues in the dataset. This should be updated according to the latest data available in my database and should be accurate per the scheduled fixtures.
  - This new tab should be called "Upcoming Matches". Users should be able to navigate to it from the home page navbar, and should be able to see the models performance on previous matches, as well as predictions for upcoming matches.
  - Users should be able to filter by league from a drop down menu and see the models predictions for upcoming matches in that league.
  - Output should be reported as the same style as the head-to-head and cross-league predictions. Update the home landing page accordingly since I am adding new features.
  - I also want to retrain/update all my models by putting more emphasis on the data from the last 10 seasons (2015-2025) rather than the entire historical dataset. Please update the training scripts accordingly to reflect this change.
    - The upcoming fixtures can be obtained from the season_links.json file ('/home/roaltshu/code/soccer_predictor/fbref_data/season_links.json') which contains links to each league season page on FBRef. The upcoming fixtures are listed on these pages.
    - It is also important to mention that the current 2025-2026 season is ongoing, so the models should be able to make predictions for matches that have not yet occurred. I also have a python script called auto_update.py ('/home/roaltshu/code/soccer_predictor/scripts/auto_update.py') that Auto-update system for soccer predictor, checks for new data, updates CSVs, and retrains models, and can be run manually or schedule with cron/Task Scheduler. I have not integrated this into my current data pipeline, so please integrate this script into the data pipeline to ensure that the models are always up to date with the latest data and runs on an automated schedule.
- Analytics page:
  - Report traditional ML metrics for the training set, and testing set, such as accuracy, precision, recall, and F1-score for each league model on the analytics page with traditional graphs that ML practitioners would expect to see. Refactor/update the analytics page accordingly to host these new metrics and graphs.

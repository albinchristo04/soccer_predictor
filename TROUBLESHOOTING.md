# To do list of improvements and new features for Soccer Predictor:

Upcoming Matches:

- The dropdown menu should be styled exactly the same as the analytics page.
- I am still not seeing any upcoming matches being populated, fix this.
- Fixtures link can be found for each league in the seasons_links.json file in fbref_data folder where in the json file per a given league look for the following entry: "fixtures_url": "https://fbref.com/en/comps/9/2025-2026/schedule/2025-2026-Premier-League-Scores-and-Fixtures" and use the correct url per league.
- Once the user selects a given league, the page should dynamically update to show the upcoming matches for that league only in a week view format (like a calendar) rather than a long list. However, there should also be an option for the user to select a given day from the week view to see all the matches for that day in a list format. Once the user sees all the matches for that day, the same model that is ran on the head-to-head prediction and cross-league prediction should be ran on these matches, and the same output format should be used (with percentages and bar graph) of the expected outcomes for each match. However, it is important to mention that the model should be ran on the upcoming matches without user input like required on the head-to-head and cross-league pages.
- The upcoming matches data can be found in fbref_data/processed/ folder where in the per league csv files, there is a column (7 respectively) called 'status' which indicates if the match has already been played or is scheduled.
- The week view calendar format should take into considerations day of the week that the user is accessing the page so that the week view is always current to the present day. So for example, if I access the page on Saturday 10/25/25, I should see in the week view format Saturday to Friday of that week with the Friday being 10/31/25.

General style:

- Ensure that the same style effects are applied across the entire website. I like the analytics page style, and how the home page is formatted. Edit the upcoming matches page, predict page, and about page, to follow the same style as the home page and analytics page. Keep it all consistent

Models:

- There is a bias towards predicting draws in the matches. This needs to be updated accordingly and fixed because this is not representative of real-world outcomes and with what I am seeing in the ML metrics data for both train and test sets.
- I think it would also be a cool feature, if the model can also report the predicted scoreline.
- If this requires training and making an entirely new model with a different model architecture than what is currently being used and means making an entirely new model.pkl for all the leagues, update the train_league_models.py script accordingly and the analyze_model.py script accordingly, so that the analytics page is also updated with the most recent model performance data

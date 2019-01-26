# YourNextBus
Bus Arrival Estimator Serving users of the LA Metro (currently in development stage)

Utilizing open bus routes and bus data from NextBus API.

Main dependencies:
- Database: MongoDB
- Backend Framework: Express
- Views: Handlebars

Reproducing the web app in your local environment:
- Clone the repository
- Install dependencies (npm install)
- Install mongodb globally
- Start an instance of mongodb (navigate to /mongo/bin, then $ ./mongod --dbpath <your path to store data>)
- In order to populate the database, navigate to the cloned repository, execute the following: $ node playground/insert-busRoutes-db.js
- Start the server: $ node server.js
- Open your browser -> url: http://localhost:3000/home

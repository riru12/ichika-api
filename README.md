# ichika-api
An API developed for ichika that works with MongoDB and Cloudinary.

## Run
On the root directory, set up a `.env` file that contains the following environment variables:
```
MONGODB_PASS = <PASSWORD>
CLOUD_NAME = <YOUR_CLOUD_NAME>
API_KEY = <YOUR_KEY>
API_SECRET = <YOUR_SECRET>
```
Install all needed packages by running `npm install`, then either, for development, run the command
```
npm run dev
```
or for production,
```
npm run serve
```

Note: This back-end server is currently set to listen at port 3000; works in conjunction with the [front-end](https://github.com/riru12/ichika).

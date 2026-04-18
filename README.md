# Pronto Coffee Co

A split coffee shop platform with:

- a standalone static marketing site in `marketing-site/`
- a Node/Express operations app for staff authentication and order management

The operations app allows a barista to log in, add to an order, view pending orders, view completed orders, and complete orders. Orders that have been completed note which barista completed the order.

**Link to project:** [Pronto Coffee Co.](https://pronto-coffee-co.herokuapp.com/)

![app image](https://raw.githubusercontent.com/ivngzmn/ivanguzmandev/main/public/static/images/projects/pronto-coffee-co.webp)

## How It's Made:

**Tech used:** HTML, Bootstrap CSS, JS, API, JSON, NODE.JS, EXPRESS, MONGODB, USER AUTH & Heroku

I wanted to be able to create a full stack web app that allowed a coffee shop to be able to have their own ordering application. I used Bootstrap for this project and it helped get the layout completed rapidly. With MongoDB Atlas it was nice and straightforward to set up and get things communicating with my developer build. As for deployment Heroku came in for the rescue.

## Local Development

- Use Node 24
- Run the app with `npm run dev:app`
- Run the marketing site with `npm run dev:marketing`
- Run both together with `npm run dev`

For local split-site development:

- operations app: `http://localhost:3000`
- marketing site: `http://localhost:4321`

## Lessons Learned:

- Using Passport was great until I wanted to pass in a third field besides the users `email` and `password`. I wanted to be able to capture the `userName` to my MondoDB database. I was able to figure it out after being stuck for a few days. This was achieved by adding the `userName` in the callback instead of attempting to pass my `userName` through the `LocalStrategy`.
- Even though I liked using render, Heroku came into the rescue and the cli tools made it much easier to deploy this time around.

## Other Projects:

Take a peek at some of my other projects:

**🚀 Portfolio:** [Portfolio](https://github.com/ivngzmn/ivanguzmandev)

**🪙 Coin Forge:** [Coin Forge](https://github.com/ivngzmn/coin-forge)

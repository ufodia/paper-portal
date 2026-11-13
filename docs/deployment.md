# Static studio deployment

Paper Portal's studio and player process camera frames on the visitor's device. Publishing the studio does not create a camera-upload service or shared game database.

Use Node.js 24, run `npm ci` and `npm run verify`, then import the repository into Vercel with `main` as the production branch. The tracked `vercel.json` selects Vite, installs locked dependencies, builds the standalone player and studio, and publishes `dist/`. No environment variables are required.

The production HTTPS address supports the browser's secure-context camera requirement. Camera access still needs the visitor's explicit permission. Downloaded games can be served on localhost with the documented helper when a browser restricts cameras in local files.

After deployment, confirm the source commit matches checked GitHub `main`, open the studio, edit a stage, run its clearly labelled simulator, print a card sheet and download a player. Synthetic browser tests verify the recognition path; qualify your real camera and physical printed cards separately.

The production sitemap describes the studio homepage. Preview deployment URLs and user-generated exported games are not included.

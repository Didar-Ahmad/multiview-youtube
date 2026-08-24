# MultiView

A static, Vercel-ready multi-YouTube viewer. Paste up to 20 YouTube links, start each with its native YouTube Play button, control mute, volume, and looping together, then copy one shareable link that reopens the entire wall.

## Deploy to Vercel

1. Import this folder into a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Leave Framework Preset as **Other** and deploy.

For a direct CLI deployment, install the Vercel CLI and run `vercel` from this folder.

## Notes

- Browsers generally permit autoplay only while muted. Clicking **Play all** enables audio.
- Playback uses YouTube's official IFrame Player API.
- YouTube independently decides how views are counted; this app does not manipulate view counts.

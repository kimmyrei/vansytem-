# Mutahus Global - Vercel Public Folder Ready

This version is made for:

```text
GitHub → Vercel Free Hobby → MongoDB Atlas Free
```

## Project Structure

```text
public/
  index.html
  style.css
  app.js
  parent-register.html
api/
  _db.js
  test-db.js
  register-parent.js
package.json
vercel.json
```

## Vercel Settings

Use these settings:

```text
Framework Preset: Other
Build Command: npm run build
Output Directory: public
Install Command: npm install
```

## Environment Variable

Add this in Vercel:

```text
MONGODB_URI
```

## Test

After deploy:

```text
https://YOUR-SITE.vercel.app/api/test-db
```

Then test:

```text
https://YOUR-SITE.vercel.app/parent-register.html
```

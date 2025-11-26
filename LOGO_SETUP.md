# TRACKIFY Logo Setup Instructions

## ⚠️ IMPORTANT: Logo File Required

The application has been updated to use the new circular building logo instead of the 🎯 emoji.

### Required Action:

1. **Save the logo image** (the circular building illustration you provided) as:
   ```
   public/images/trackify-logo.png
   ```

2. **Image Requirements:**
   - Format: PNG (with transparency)
   - Recommended size: 200x200 pixels or higher
   - File name: `trackify-logo.png`
   - Location: `public/images/` folder

### Where the Logo Appears:

✅ All HTML pages (login, dashboards, home)
✅ Email templates (OTP, visitor alerts, staff notifications)
✅ Headers and navigation bars
✅ Mobile responsive views

### Alternative: Use GitHub Hosted Image

If you prefer, the email templates are already configured to use:
```
https://raw.githubusercontent.com/vunnamthanuja/Trackify-deploy/main/public/images/trackify-logo.png
```

Make sure to push the logo file to your GitHub repository for this to work.

### Steps to Add the Logo:

1. Copy your circular building logo image
2. Rename it to `trackify-logo.png`
3. Place it in: `public/images/trackify-logo.png`
4. Commit and push to GitHub
5. Deploy to Render

### CSS Styling Applied:

- Logo size: 40-50px (responsive to header size)
- Shape: Circular (border-radius: 50%)
- Alignment: Vertically centered with TRACKIFY text
- Spacing: 12-15px gap between logo and text

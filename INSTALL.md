# Installation Guide - GPX Adjuster

Detailed instructions for deploying the GPX Adjuster web application to web hosting with FTP and cPanel access.

## Hosting Requirements

- **Hosting Type:** Shared hosting, VPS, or dedicated server
- **Web Server:** Apache or Nginx
- **Access:** FTP/SFTP or SSH
- **cPanel:** Recommended (but not required)
- **PHP:** Not required (purely static application)
- **Node.js on server:** Not required

> **Important:** After building, this application is a fully static website (HTML, CSS, JavaScript). It does not require a running Node.js server on the hosting. It works on any basic web hosting.

## Local Environment Setup

### 1. Install Dependencies

```bash
cd "GPX adjuster"
npm install
```

### 2. Build Application for Production

```bash
npm run build
```

After the build completes, an `/out` folder will be created containing static files ready for deployment.

### 3. Verify Build

```bash
ls -lh out/
```

You should see:
- `index.html` - main page
- `404.html` - error page
- `_next/` - folder with optimized CSS/JS files
- `sample.gpx` - sample file

Total size: **~2-3 MB**

## Option A: Deployment via FTP/SFTP

### Step 1: Connect to FTP

Use an FTP client (recommended: FileZilla, Cyberduck, WinSCP):

**Connection Details:**
```
Host: ftp.your-domain.com (or server IP address)
Username: your_ftp_login
Password: your_ftp_password
Port: 21 (FTP) or 22 (SFTP)
```

> **Tip:** SFTP is more secure than FTP. If available, use SFTP.

### Step 2: Locate the Correct Server Folder

After connecting, find the web folder. Common names:
- `public_html/` - most common
- `www/`
- `htdocs/`
- `web/`
- `domains/your-domain.com/public_html/`

> **Warning:** Upload files INSIDE this folder, not the entire `out/` folder.

### Step 3: Upload Files

**FileZilla:**
1. In the left panel (local computer), navigate to `GPX adjuster/out/`
2. In the right panel (server), navigate to `public_html/`
3. Select EVERYTHING from the `out/` folder:
   - `index.html`
   - `404.html`
   - `_next/` folder
   - `sample.gpx`
4. Drag the selected files to the right panel
5. Wait for upload to complete (~2-3 MB, takes 1-5 minutes depending on connection speed)

**WinSCP:**
1. Open local folder `GPX adjuster/out/`
2. Open remote folder `public_html/`
3. Select all files in the local folder
4. Click "Upload" or press F5
5. Confirm upload

### Step 4: Set Permissions

Correct permissions:
- **Folders:** `755` (drwxr-xr-x)
- **Files:** `644` (-rw-r--r--)

**In FileZilla:**
1. Right-click on `_next/` folder → File permissions
2. Set to `755` and check "Recurse into subdirectories"
3. Right-click on `index.html` → File permissions → `644`
4. Repeat for other HTML files

## Option B: Deployment via cPanel

### Step 1: Login to cPanel

```
URL: https://your-domain.com:2083
or: https://cpanel.your-hosting.com
```

Log in with your credentials.

### Step 2: Upload via File Manager

1. In cPanel, find the **"Files"** section
2. Click on **"File Manager"**
3. Navigate to the `public_html/` folder

### Step 3: Upload Files

**Method 1: Upload via ZIP (Recommended for larger files)**

1. **On your local computer:**
   ```bash
   cd "GPX adjuster"
   zip -r gpx-app.zip out/*
   ```

2. **In cPanel File Manager:**
   - Click "Upload" in the top bar
   - Select the `gpx-app.zip` file
   - Wait for upload to complete
   - Close the upload dialog

3. **Extract ZIP:**
   - In File Manager, right-click on `gpx-app.zip`
   - Select "Extract"
   - Confirm extraction to current folder
   - After extraction, delete `gpx-app.zip`

4. **Move Files:**
   - If an `out/` folder was created, move its contents to `public_html/`
   - Select all files inside `out/`
   - Click "Move" → enter target path `/public_html/`

**Method 2: Direct File Upload**

1. Click "Upload" in the top bar of File Manager
2. Drag files from the `out/` folder to the upload window:
   - `index.html`
   - `404.html`
   - `sample.gpx`
3. For the `_next/` folder:
   - First create a `_next/` folder using "New Folder"
   - Enter the folder
   - Upload contents from `out/_next/`

### Step 4: Verify Structure

The structure in `public_html/` should look like this:

```
public_html/
├── index.html
├── 404.html
├── sample.gpx
├── _next/
│   ├── static/
│   │   ├── chunks/
│   │   └── css/
│   └── ...
└── other_website_files (if any)
```

### Step 5: Set Document Root (if needed)

If your domain doesn't point to the correct folder:

1. In cPanel, find **"Domains"**
2. Click on **"Domains"** or **"Addon Domains"**
3. Check the "Document Root" for your domain
4. It should point to `public_html/` or the folder with uploaded files

## Apache Configuration (.htaccess)

If you're using Apache web server (most hosting providers), create a `.htaccess` file in `public_html/`:

### Step 1: Create .htaccess

In cPanel File Manager:
1. Navigate to `public_html/`
2. Click "New File"
3. Name the file `.htaccess`
4. Right-click on the file → "Edit"

### Step 2: .htaccess Contents

```apache
# GPX Adjuster - Apache Configuration

# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On

    # Images
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"

    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"

    # HTML
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Custom error pages
ErrorDocument 404 /404.html

# SPA routing support (if needed in the future)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # If file or folder doesn't exist, redirect to index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    # RewriteRule . /index.html [L]
    # (Currently commented out because the app uses static exports)
</IfModule>

# Allow access to .gpx files
<FilesMatch "\.gpx$">
    Header set Content-Type "application/gpx+xml"
    Header set Content-Disposition "inline"
</FilesMatch>
```

Save the file.

## Verify Functionality

### 1. Open Website in Browser

Visit: `https://your-domain.com`

### 2. What Should Work:

- ✅ Page loads
- ✅ Elevation editor displays with sample data (sample.gpx)
- ✅ Elevation chart is visible
- ✅ Map loads (Leaflet)
- ✅ "Load New GPX" button works
- ✅ GPX export works

### 3. Testing

1. **Load Test:**
   - Open DevTools (F12) → Console
   - There should be no 404 errors
   - In the Network tab, all files should be green (status 200)

2. **Functionality Test:**
   - Click on the chart → elevation should change
   - Use the "Smooth Elevation Data" button
   - Download the modified GPX file

3. **Responsiveness Test:**
   - Open the website on a mobile device
   - Verify everything works on smaller screens

## Troubleshooting Common Issues

### Issue 1: Blank Page (White Screen)

**Solution:**
1. Check the Console in DevTools (F12)
2. If you see 404 errors on CSS/JS files:
   - Verify that the `_next/` folder is properly uploaded
   - Check file permissions (755 for folders, 644 for files)

### Issue 2: "Cannot GET /_next/..."

**Cause:** Incorrect path or missing files

**Solution:**
1. Make sure you uploaded the CONTENTS of the `out/` folder, not the folder itself
2. Structure should be: `public_html/index.html` (NOT `public_html/out/index.html`)

### Issue 3: GPX Files Download Instead of Displaying

**Solution:** Add to `.htaccess`:
```apache
<FilesMatch "\.gpx$">
    Header set Content-Type "application/gpx+xml"
    Header set Content-Disposition "inline"
</FilesMatch>
```

### Issue 4: Map Not Displaying

**Cause:** Leaflet CSS can't find images

**Solution:**
- Check Console in DevTools
- Make sure all files in the `_next/static/` folder are uploaded

### Issue 5: Slow Loading

**Solution:**
1. Verify GZIP compression is active
2. Add the `.htaccess` configuration above
3. Check hosting speed (ping, download speed)

### Issue 6: SSL Certificate (HTTPS)

**If you don't have HTTPS:**

In cPanel:
1. Find **"Security"** → **"SSL/TLS Status"**
2. Click **"Run AutoSSL"**
3. Wait 5-10 minutes for certificate generation

**Or use Let's Encrypt** (if supported):
1. cPanel → "SSL/TLS"
2. "Manage SSL sites"
3. Select your domain and use Let's Encrypt

## Updating the Application

When you make changes to the code:

### Step 1: Local Build
```bash
cd "GPX adjuster"
npm run build
```

### Step 2: Backup Production Data

If you've added custom GPX files to the server:
1. Download them via FTP or File Manager
2. Save them to a local folder for later upload

### Step 3: Upload New Files

**Via FTP:**
1. Connect to FTP
2. Delete the old `_next/` folder on the server
3. Upload new contents from the `out/` folder

**Via cPanel:**
1. File Manager → Delete old `_next/` folder
2. Upload new files using the ZIP method (see above)

### Step 4: Clear Cache

After updating, clear your browser cache: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

## Deploying to a Subdomain

If you want the app on `gpx.your-domain.com`:

### In cPanel:

1. **Create Subdomain:**
   - Domains → Subdomains
   - Enter: `gpx`
   - Set Document Root to: `/public_html/gpx/`
   - Click "Create"

2. **Upload Files:**
   - File Manager → Navigate to `/public_html/gpx/`
   - Upload contents of the `out/` folder here

3. **Test:**
   - Visit `https://gpx.your-domain.com`

## Deploying to a Subfolder

If you want the app at `your-domain.com/gpx/`:

### Step 1: Edit next.config.js Before Building

```javascript
const nextConfig = {
  output: 'export',
  basePath: '/gpx',  // ADD THIS LINE
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ... rest of configuration
};
```

### Step 2: Build with New basePath

```bash
npm run build
```

### Step 3: Upload to Subfolder

Upload contents of `out/` to `/public_html/gpx/`

### Step 4: Access

The application will be available at: `https://your-domain.com/gpx/`

## Recommended Hosting Providers

Tested and working on:

- **Namecheap** - ✅ Works (Apache, cPanel)
- **Bluehost** - ✅ Works (Apache, cPanel)
- **SiteGround** - ✅ Works (Apache, own panel)
- **HostGator** - ✅ Works (Apache, cPanel)
- **A2 Hosting** - ✅ Works (Apache, cPanel)

## Conclusion

After completing the installation, the GPX Adjuster application should be running on your web hosting and accessible through your domain.

For further questions or issues:
1. Check the error log in cPanel (Errors → Error Log)
2. Use DevTools Console (F12) to diagnose problems
3. Verify `.htaccess` syntax through an online validator

---

**Document Version:** 1.0
**Date:** 2025-11-02
**Application:** GPX Adjuster

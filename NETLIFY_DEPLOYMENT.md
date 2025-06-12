# Netlify Deployment Guide for InnovateLab Waitlist

## 🚀 Quick Deployment Steps

### 1. Connect Repository to Netlify
1. Push your code to GitHub/GitLab
2. Go to [Netlify Dashboard](https://app.netlify.com/)
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 2. Environment Variables
Set these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Database Configuration (Required)
DATABASE_URL=your_postgresql_url
PGHOST=your_db_host
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=your_db_name

# Node Environment
NODE_ENV=production
NODE_VERSION=18
```

### 3. Database Setup
Since Netlify is serverless, you'll need an external PostgreSQL database:

**Recommended Providers:**
- **Neon** (Free tier, PostgreSQL): https://neon.tech
- **Supabase** (Free tier): https://supabase.com
- **Railway** (Simple setup): https://railway.app
- **PlanetScale** (MySQL alternative): https://planetscale.com

**Setup Steps:**
1. Create database on chosen provider
2. Get connection string
3. Add to Netlify environment variables
4. Run migrations: `npm run db:push`

### 4. Custom Domain (Optional)
1. In Netlify Dashboard → Domain settings
2. Add custom domain
3. Configure DNS records
4. SSL automatically provided

## 📁 Project Structure for Netlify

```
├── dist/                    # Build output (auto-generated)
├── netlify/
│   └── functions/          # Serverless functions
├── client/                 # Frontend source
├── server/                 # Backend source (for development)
├── netlify.toml           # Netlify configuration
├── .gitignore             # Git ignore rules
└── package.json           # Dependencies
```

## ⚙️ Configuration Files

### netlify.toml
```toml
[build]
  base = "."
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Build Commands
- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Database Push**: `npm run db:push`

## 🔧 Troubleshooting

### Common Issues

**1. Build Fails**
```bash
# Check Node version
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**2. Database Connection Error**
- Verify DATABASE_URL in environment variables
- Check database is accessible from internet
- Ensure IP whitelist includes 0.0.0.0/0 for Netlify

**3. API Routes Not Working**
- Ensure netlify.toml redirects are configured
- Check function deployment in Netlify Functions tab
- Verify CORS headers in functions

**4. Environment Variables Not Loading**
- Check spelling in Netlify dashboard
- Redeploy after adding variables
- Use `process.env.VARIABLE_NAME` in code

### Performance Optimization

**1. Enable Caching**
```toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

**2. Enable Compression**
- Automatically handled by Netlify
- Gzip compression for all assets

**3. Image Optimization**
- Use WebP format when possible
- Implement lazy loading
- Consider Netlify Image CDN

## 🌐 Production Checklist

### Before Deployment
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Build process tested locally
- [ ] Error handling implemented
- [ ] Security headers configured

### After Deployment
- [ ] Test all functionality
- [ ] Verify database connections
- [ ] Check admin dashboard access
- [ ] Confirm form submissions work
- [ ] Test on mobile devices

### Monitoring & Analytics
- [ ] Set up Netlify Analytics
- [ ] Configure error monitoring
- [ ] Add performance monitoring
- [ ] Set up uptime monitoring

## 🔒 Security Configuration

### Headers (in netlify.toml)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Environment Security
- Never commit secrets to Git
- Use Netlify's encrypted environment variables
- Rotate database credentials regularly
- Enable database connection encryption

## 📊 Expected Performance

### Lighthouse Scores (Target)
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 90+
- **SEO**: 95+

### Load Times
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s

## 🚀 Deployment URL
Once deployed, your site will be available at:
- **Netlify subdomain**: `https://[site-name].netlify.app`
- **Custom domain**: `https://your-domain.com` (if configured)

## 📞 Support & Resources

### Netlify Documentation
- [Netlify Docs](https://docs.netlify.com/)
- [Build Configuration](https://docs.netlify.com/configure-builds/)
- [Environment Variables](https://docs.netlify.com/environment-variables/)

### Database Providers
- [Neon Documentation](https://neon.tech/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app/)

---

**Created by**: Ervin Radosavlevici (ervin210@icloud.com)
**Last Updated**: January 12, 2025
**Version**: 1.0.0
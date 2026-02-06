# Deployment Guide

This guide covers deployment options for the Tarjeta Roja Soccer Predictor application.

## Deployment Options

### 1. Cloudflare (Recommended)

For modern, fast deployment with excellent global CDN:

- **Frontend**: Cloudflare Pages
- **Backend**: Cloudflare Workers
- **Storage**: Cloudflare R2 (optional)

See [Cloudflare Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.

### 2. Vercel (Alternative)

Traditional serverless deployment option:

- **Frontend**: Vercel Edge Network
- **Backend**: Vercel Serverless Functions
- **Storage**: Vercel Blob or external (AWS S3, etc.)

Continue reading this document for Vercel deployment instructions.

## Prerequisites

- GitHub account
- Deployment platform account (Cloudflare or Vercel)
- Trained models in `fbref_data/*/models/` directories
- Your repository pushed to GitHub

## Important Notes

⚠️ **Large File Warning**: The `fbref_data` folder contains CSV files and trained models that may exceed deployment platform limits. You have two options:

1. **Include data in repo** (current approach - works for <500MB total)
2. **Use cloud storage** (recommended for production - see Cloud Storage section below)

## Quick Start - Cloudflare Deployment

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy Frontend**
   ```bash
   npm run build
   wrangler pages deploy .output/public --project-name=tarjeta-roja-soccer-predictor
   ```

4. **Deploy Backend**
   ```bash
   wrangler deploy
   ```

## Quick Start - Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   1. Go to [vercel.com](https://vercel.com)
   2. Import your repository
   3. Configure environment variables
   4. Deploy

## Environment Variables

### Required Variables

```bash
# Frontend API URL
NEXT_PUBLIC_API_URL=https://your-deployment-url.com

# Backend URL (if separate)
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Optional Variables

```bash
# Google OAuth (for authentication)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Database (for production)
DATABASE_URL=your-database-connection-string

# JWT Secret
JWT_SECRET_KEY=your-jwt-secret
```

## Cloud Storage Options

For production deployments with large data files:

### Cloudflare R2
```bash
# Install wrangler
npm install -g wrangler

# Create bucket
wrangler r2 bucket create tarjeta-roja-data

# Upload files
wrangler r2 object put tarjeta-roja-data/path/to/file --file=./local/path/to/file
```

### AWS S3
```bash
# Upload with AWS CLI
aws s3 sync ./fbref_data s3://your-bucket-name/fbref_data --exclude "*.git/*"
```

## Custom Domain Setup

### Cloudflare
1. Add domain in Cloudflare Dashboard
2. Update nameservers to Cloudflare
3. Configure SSL/TLS settings
4. Update environment variables

### Vercel
1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update environment variables

## Monitoring and Analytics

### Built-in Options
- Cloudflare Analytics Dashboard
- Vercel Analytics
- Google Analytics (optional)

### Third-party Options
- UptimeRobot (free monitoring)
- Sentry (error tracking)
- LogRocket (session replay)

## CI/CD Setup

### GitHub Actions Example

```yaml
name: Deploy Application

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Cloudflare
        run: |
          npm install -g wrangler
          wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Performance Optimization

### Frontend Optimization
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Caching strategies
- CDN configuration

### Backend Optimization
- Database connection pooling
- API response caching
- Rate limiting
- Efficient data loading

## Security Best Practices

### Essential Security Measures
- HTTPS only (enforced by both platforms)
- Environment variable management
- Input validation and sanitization
- Rate limiting for API endpoints
- Secure headers configuration

### Additional Security
- Content Security Policy (CSP)
- Web Application Firewall (WAF)
- DDoS protection
- Security headers

## Troubleshooting Common Issues

### Build Failures
```bash
# Check dependencies
npm install
npm run build

# Clear cache
npm run clean
```

### Deployment Errors
```bash
# Check platform status
# Verify environment variables
# Review build logs
```

### Runtime Issues
```bash
# Check browser console
# Review server logs
# Monitor performance metrics
```

## Cost Management

### Free Tier Usage
- Monitor monthly usage limits
- Set up billing alerts
- Optimize resource usage

### Paid Plans
- Cloudflare Pro: ~$10/month
- Vercel Pro: ~$20/month
- Consider usage-based pricing

## Migration Between Platforms

### From Vercel to Cloudflare
1. Export environment variables
2. Update DNS settings
3. Deploy to Cloudflare
4. Update application configurations
5. Test all functionality
6. Switch DNS once verified

### From Cloudflare to Vercel
1. Export environment variables
2. Update DNS settings
3. Deploy to Vercel
4. Update application configurations
5. Test all functionality
6. Switch DNS once verified

## Support Resources

### Documentation
- [Cloudflare Docs](https://developers.cloudflare.com)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Community Support
- Platform Discord communities
- GitHub Issues
- Stack Overflow

---
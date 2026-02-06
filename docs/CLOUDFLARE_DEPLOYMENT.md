# Cloudflare Deployment Guide

This guide will help you deploy the Tarjeta Roja Soccer Predictor to Cloudflare Pages and Workers for production hosting.

## Prerequisites

- Cloudflare account (free tier is sufficient)
- GitHub account
- Wrangler CLI installed (`npm install -g wrangler`)
- Trained models in `fbref_data/*/models/` directories
- Your repository pushed to GitHub

## Important Notes

⚠️ **Large File Warning**: The `fbref_data` folder contains CSV files and trained models that may exceed Cloudflare's limits. You have two options:

1. **Include data in repo** (current approach - works for <500MB total)
2. **Use cloud storage** (recommended for production - see Cloud Storage section below)

## Deployment Options

### Option 1: Cloudflare Pages (Frontend Only)

For static frontend deployment:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Cloudflare Pages deployment"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   2. Navigate to Pages → Create a project
   3. Connect to your GitHub repository
   4. Configure build settings:
      - **Framework preset**: Next.js
      - **Build command**: `npm run build`
      - **Build output directory**: `.next`
      - **Root directory**: `/`

3. **Environment Variables**
   Add these in Cloudflare Pages → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-worker.your-subdomain.workers.dev
   ```

### Option 2: Cloudflare Workers + Pages (Full Stack)

For full-stack deployment with backend:

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Configure wrangler.toml**
   The file is already created with proper settings.

4. **Deploy Frontend to Pages**
   ```bash
   # Build the project
   npm run build
   
   # Deploy to Cloudflare Pages
   wrangler pages deploy .output/public --project-name=tarjeta-roja-soccer-predictor
   ```

5. **Deploy Backend to Workers**
   ```bash
   # Deploy the backend worker
   wrangler deploy
   
   # The worker will be available at:
   # https://tarjeta-roja-soccer-predictor.your-subdomain.workers.dev
   ```

## Deployment Architecture

```
Cloudflare Network
├── Cloudflare Pages (Frontend)
│   ├── Static Assets
│   └── Server Side Rendering
└── Cloudflare Workers (Backend API)
    ├── FastAPI Application
    └── Serverless Functions
```

## Configuration Files

### wrangler.toml
```toml
name = "tarjeta-roja-soccer-predictor"
main = ".output/server/index.mjs"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "next build"

[vars]
NEXT_PUBLIC_API_URL = "https://tarjetarojaenvivo.live"
NEXT_PUBLIC_BACKEND_URL = ""
```

## Limitations & Solutions

### Issue 1: Worker Size Limits

**Problem**: Cloudflare Workers have a 1MB script size limit
**Solution**: 
- Use Pages for frontend, Workers for API
- Optimize dependencies
- Consider Durable Objects for larger applications

### Issue 2: Cold Starts

**Problem**: First request after idle time takes longer
**Solution**:
- Implement loading spinners (already done ✅)
- Use Cloudflare Pro for better performance
- Consider scheduled warming requests

### Issue 3: Large Data Files

**Problem**: Git repos >500MB cause deployment issues
**Solution**: Use cloud storage (see next section)

## Cloud Storage Migration (Recommended)

For production, host data on Cloudflare R2 or external storage:

### Cloudflare R2 Approach

1. **Create R2 Bucket**
   ```bash
   wrangler r2 bucket create soccer-predictor-data
   ```

2. **Upload data to R2**
   ```bash
   wrangler r2 object put soccer-predictor-data/fbref_data/premier_league/data/processed.csv --file=./fbref_data/premier_league/data/processed.csv
   ```

3. **Update backend to load from R2**
   ```python
   import boto3
   from cloudflare import Cloudflare
   
   # Configure R2 client
   s3 = boto3.client(
       's3',
       endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
       aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
       aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY')
   )
   
   def load_from_r2(bucket, key):
       obj = s3.get_object(Bucket=bucket, Key=key)
       return obj['Body'].read()
   ```

4. **Add environment variables**
   ```
   R2_ACCESS_KEY_ID=your_key
   R2_SECRET_ACCESS_KEY=your_secret
   R2_ACCOUNT_ID=your_account_id
   ```

## Custom Domain

1. Go to Cloudflare Dashboard → Websites
2. Add your custom domain (e.g., `tarjetarojaenvivo.live`)
3. Update DNS records to point to Cloudflare
4. Configure SSL/TLS encryption (Full or Full (strict))
5. Update `NEXT_PUBLIC_API_URL` environment variable

## Monitoring

Cloudflare provides:

- **Analytics**: Real-time visitor stats
- **Logs**: Worker execution logs via Wrangler
- **Performance**: Page load metrics
- **Security**: DDoS protection and WAF

Access in Cloudflare Dashboard → Analytics

## CI/CD

Auto-deployment setup:

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: tarjeta-roja-soccer-predictor
          directory: .output/public

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Wrangler
        run: npm install -g wrangler
      
      - name: Deploy Worker
        run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Costs

### Free Tier Limits:
- **Pages**: 100GB bandwidth/month, 500 builds/month
- **Workers**: 100,000 requests/day, 10ms CPU time per request
- **R2**: 10GB storage, 1 million reads, 1 million writes

### Paid Plans:
- **Pro ($10/month)**: Better performance, analytics
- **Business ($200/month)**: Enterprise features
- **Pay-as-you-go**: Scale based on usage

## Troubleshooting

### Build Fails: "Module not found"
```bash
# Ensure all dependencies in package.json
npm install
npm run build  # Test locally first
```

### Worker Deployment Fails
```bash
# Check wrangler configuration
wrangler whoami
wrangler deploy --dry-run
```

### API Routes 404
```bash
# Verify worker is deployed correctly
curl https://your-worker.your-subdomain.workers.dev/api/health
```

### Large File Deployment
```bash
# Add to .gitignore
echo "fbref_data/*.csv" >> .gitignore
echo "fbref_data/*/visualizations/*.png" >> .gitignore

# Use Git LFS for models
git lfs track "*.pkl"
git add .gitattributes
```

## Alternative: Vercel

If Cloudflare doesn't work for your needs, Vercel deployment is still supported:

### Vercel Deployment
1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Configure environment variables
4. Deploy

## Production Checklist

- [ ] All models trained and committed
- [ ] Environment variables configured
- [ ] Loading states implemented
- [ ] Error handling added
- [ ] Analytics tracking setup (optional)
- [ ] Custom domain configured
- [ ] Monitoring/logging enabled
- [ ] README updated with live URL
- [ ] Pre-commit hooks installed
- [ ] Tests passing

## Post-Deployment

1. Test all features on production URL
2. Monitor performance and logs
3. Check error logs daily for first week
4. Set up uptime monitoring (UptimeRobot, Pingdom)
5. Add Google Analytics (optional)

## Support

- Cloudflare Docs: https://developers.cloudflare.com
- Next.js on Cloudflare: https://developers.cloudflare.com/pages/framework-guides/nextjs
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler

---
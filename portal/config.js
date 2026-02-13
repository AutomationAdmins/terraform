// ============================================================
// config.js — Update these values for your GitHub setup
// ============================================================

const CONFIG = {
  // GitHub OAuth App credentials (create at https://github.com/settings/developers)
  // For GitHub Pages: set callback URL to https://<username>.github.io/<repo>/callback.html
  GITHUB_CLIENT_ID: 'YOUR_CLIENT_ID_HERE',

  // Your GitHub repo where issues will be created
  REPO_OWNER: 'adminran',
  REPO_NAME: 'terraform',

  // Issue label that triggers the self-service bot
  ISSUE_LABEL: 'infra-request',

  // Region options per cloud provider
  REGIONS: {
    GCP: [
      { value: 'asia-south1', label: 'Asia South (Mumbai)' },
      { value: 'us-central1', label: 'US Central (Iowa)' },
      { value: 'europe-west1', label: 'Europe West (Belgium)' },
    ],
    AWS: [
      { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'eu-west-1', label: 'EU West (Ireland)' },
    ],
  },
};

import serverless from 'serverless-http';
import appConfig from '../../server.js';

// Netlify's CommonJS bundler can sometimes nest the default export
const app = appConfig.default || appConfig;

export const handler = serverless(app);

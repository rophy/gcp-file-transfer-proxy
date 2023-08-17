const requiredEnvVars = ['GCP_SUBSCRIPTION_NAME'];

requiredEnvVars.forEach(envVarName => {
    if (!process.env[envVarName]) throw new Error(`Missing required env var "${envVarName}`);
})

const config = {};

config.port = process.env.PORT || 3000;
config.subscriptionName = process.env.GCP_SUBSCRIPTION_NAME;
config.retentionSeconds = parseInt(process.env.GCP_RETENTION_SECONDS || '3600');

module.exports = config;

module.exports = {
  apps: [
    {
      name: "my-app",
      script: "app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production", // Set NODE_ENV to 'production'
        ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
        BUCKET_NAME: process.env.BUCKET_NAME,
        REGION: process.env.REGION,
        SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
        JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE,
        JWT_EXPIRE: process.env.JWT_EXPIRE,
        JWT_SECRET: process.env.JWT_SECRET,
        MAX_FILE_UPLOAD: process.env.MAX_FILE_UPLOAD,
        MONGO_URI: process.env.MONGO_URI,
        PORT: process.env.PORT || 5000,
        PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
        TERMII_API_KEY: process.env.TERMII_API_KEY,
        BREVO_API_KEY: process.env.BREVO_API_KEY,
      },
      // You can also define additional environments
      env_staging: {
        NODE_ENV: "staging",
        PORT: 3001,
        // Add more environment variables specific to staging environment
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3002,
        // Add more environment variables specific to development environment
      },
    },
    // You can define multiple applications if needed
  ],
};

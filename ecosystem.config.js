module.exports = {
  apps: [
    {
      name: "portfolio-site",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4000",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

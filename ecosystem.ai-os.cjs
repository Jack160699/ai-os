module.exports = {
  apps: [
    {
      name: "stratxcel-frontend",
      cwd: "/opt/ai-os/apps/ai-os",
      script: "npm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: "3012",
      },
      max_restarts: 10,
      restart_delay: 2000,
      time: true,
    },
  ],
};

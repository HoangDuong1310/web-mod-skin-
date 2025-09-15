module.exports = {
  apps: [
    {
      name: 'web-mod-skin',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/html/web-mod-skin',
      instances: 1,
      exec_mode: 'fork',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Increase Node.js memory limit for large file processing
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      
      // Resource limits
      max_memory_restart: '2G',
      
      // Logging
      log_file: '/var/log/pm2/web-mod-skin-combined.log',
      out_file: '/var/log/pm2/web-mod-skin-out.log',
      error_file: '/var/log/pm2/web-mod-skin-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Ignore watch for performance
      ignore_watch: [
        'node_modules',
        '.git',
        'uploads',
        'logs'
      ]
    }
  ]
}

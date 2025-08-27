import express from 'express'
import cors from 'cors'
import path from 'path'
import { promises as fs, existsSync } from 'fs'
import Database from 'better-sqlite3'
import open from 'open'
import chalk from 'chalk'
import os from 'os'

interface ServerOptions {
  port?: number
  open?: boolean
  api?: boolean
}

interface Execution {
  id: number
  session_id: string
  timestamp: string
  tool_name: string
  tool_input: string
  tool_response: string
  project_path: string
  duration_ms: number | null
  success: boolean
  error_message: string | null
}

// Import dashboard data collection functions
async function collectDashboardData() {
  const { collectDashboardData: collect } = await import('./dashboard')
  return collect({ skipUsage: false, refresh: false })
}

export async function serverCommand(options: ServerOptions = {}) {
  const port = options.port || 3000
  const shouldOpen = options.open !== false
  const apiOnly = options.api || false

  const dbPath = path.join(os.homedir(), '.claude', 'db.sql')
  
  try {
    await fs.access(dbPath)
  } catch {
    console.error(chalk.red('Database not found. Please run "ccm init" first.'))
    process.exit(1)
  }

  const db = new Database(dbPath, { readonly: true })
  const app = express()

  app.use(cors())
  app.use(express.json())

  // API endpoints
  app.get('/api/executions', (req, res) => {
    const { project, startDate, endDate, limit = 1000 } = req.query
    
    let query = 'SELECT * FROM executions WHERE 1=1'
    const params: any[] = []

    if (project) {
      query += ' AND project_path LIKE ?'
      params.push(`%${project}%`)
    }

    if (startDate) {
      query += ' AND timestamp >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND timestamp <= ?'
      params.push(endDate)
    }

    query += ' ORDER BY timestamp DESC LIMIT ?'
    params.push(Number(limit))

    try {
      const executions = db.prepare(query).all(...params) as Execution[]
      res.json(executions)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch executions' })
    }
  })

  app.get('/api/stats', (req, res) => {
    const { project, startDate, endDate } = req.query
    
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (project) {
      whereClause += ' AND project_path LIKE ?'
      params.push(`%${project}%`)
    }

    if (startDate) {
      whereClause += ' AND timestamp >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND timestamp <= ?'
      params.push(endDate)
    }

    try {
      const totalExecutions = db.prepare(
        `SELECT COUNT(*) as count FROM executions ${whereClause}`
      ).get(...params) as { count: number }

      const uniqueSessions = db.prepare(
        `SELECT COUNT(DISTINCT session_id) as count FROM executions ${whereClause}`
      ).get(...params) as { count: number }

      const totalProjects = db.prepare(
        `SELECT COUNT(DISTINCT project_path) as count FROM executions ${whereClause}`
      ).get(...params) as { count: number }

      const avgDuration = db.prepare(
        `SELECT AVG(duration_ms) as avg FROM executions ${whereClause} AND duration_ms IS NOT NULL`
      ).get(...params) as { avg: number | null }

      const toolUsage = db.prepare(
        `SELECT tool_name, COUNT(*) as count FROM executions ${whereClause} 
         GROUP BY tool_name ORDER BY count DESC`
      ).all(...params) as Array<{ tool_name: string; count: number }>

      const projectUsage = db.prepare(
        `SELECT project_path as path, COUNT(*) as count FROM executions ${whereClause} 
         GROUP BY project_path ORDER BY count DESC LIMIT 10`
      ).all(...params) as Array<{ path: string; count: number }>

      const stats = {
        totalExecutions: totalExecutions.count,
        uniqueSessions: uniqueSessions.count,
        totalProjects: totalProjects.count,
        avgDuration: avgDuration.avg || 0,
        toolUsage: toolUsage.reduce((acc, { tool_name, count }) => {
          acc[tool_name] = count
          return acc
        }, {} as Record<string, number>),
        projectUsage
      }

      res.json(stats)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' })
    }
  })

  app.get('/api/sessions', (req, res) => {
    try {
      const sessions = db.prepare(
        `SELECT session_id, MIN(timestamp) as start_time, MAX(timestamp) as end_time,
         COUNT(*) as execution_count, project_path
         FROM executions 
         GROUP BY session_id, project_path 
         ORDER BY start_time DESC 
         LIMIT 100`
      ).all()

      res.json(sessions)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sessions' })
    }
  })

  app.get('/api/projects', (req, res) => {
    try {
      const projects = db.prepare(
        `SELECT DISTINCT project_path FROM executions ORDER BY project_path`
      ).all()

      res.json(projects)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' })
    }
  })

  // New endpoint for full dashboard data
  app.get('/api/dashboard', async (req, res) => {
    try {
      const data = await collectDashboardData()
      res.json(data)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' })
    }
  })

  if (!apiOnly) {
    // Serve the original bento dashboard HTML
    app.get('/', async (req, res) => {
      try {
        // Read the bento template
        const templatePath = path.join(__dirname, '../templates/bento-dashboard.html')
        let template = await fs.readFile(templatePath, 'utf8')
        
        // Collect dashboard data
        const data = await collectDashboardData()
        
        // Inject data into template
        const jsonData = JSON.stringify(data)
        const base64Data = Buffer.from(jsonData).toString('base64')
        
        let htmlContent = template.replace(
          '/*DATA_PLACEHOLDER*/', 
          `JSON.parse(atob('${base64Data}'))`
        )
        
        // Send the HTML
        res.send(htmlContent)
      } catch (error) {
        console.error(chalk.red('Failed to serve dashboard:'), error)
        res.status(500).send('Failed to load dashboard')
      }
    })
    
    // Serve any static assets from templates directory
    app.use('/assets', express.static(path.join(__dirname, '../templates')))
  }

  const server = app.listen(port, () => {
    console.log(chalk.green(`✓ Dashboard server running at http://localhost:${port}`))
    
    if (apiOnly) {
      console.log(chalk.blue('API endpoints:'))
      console.log('  GET /api/executions')
      console.log('  GET /api/stats')
      console.log('  GET /api/sessions')
      console.log('  GET /api/projects')
      console.log('  GET /api/dashboard')
    } else {
      console.log(chalk.blue('Dashboard available at root path /'))
      console.log(chalk.blue('API endpoints available at /api/*'))
    }

    if (shouldOpen && !apiOnly) {
      open(`http://localhost:${port}`)
    }
  })

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down dashboard server...'))
    server.close(() => {
      db.close()
      process.exit(0)
    })
  })

  process.on('SIGTERM', () => {
    server.close(() => {
      db.close()
      process.exit(0)
    })
  })
}
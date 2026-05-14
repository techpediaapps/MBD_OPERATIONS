import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const app = express();
app.use(express.json());

// Initialize data directory
async function initData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Create initial files if they don't exist
    for (const file of ['employees.json', 'trainings.json', 'users.json']) {
      const filePath = path.join(DATA_DIR, file);
      try {
        await fs.access(filePath);
      } catch {
        if (file === 'users.json') {
          await fs.writeFile(filePath, JSON.stringify([
            { id: '1', username: 'admin', password: 'password', role: 'Admin', email: 'admin@mainetti.com' }
          ]));
        } else {
          await fs.writeFile(filePath, '[]');
        }
      }
    }
  } catch (err) {
    console.error('Failed to initialize data directory:', err);
  }
}
initData();

// Helper to read JSON files
async function readData(file: string) {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Helper to write JSON files
async function writeData(file: string, data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/users', async (req, res) => {
  try {
    const data = await readData('users.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    await writeData('users.json', req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save users' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await readData('users.json');
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const data = await readData('employees.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    await writeData('employees.json', req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save employees' });
  }
});

app.get('/api/trainings', async (req, res) => {
  try {
    const data = await readData('trainings.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read trainings' });
  }
});

app.post('/api/trainings', async (req, res) => {
  try {
    await writeData('trainings.json', req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save trainings' });
  }
});

app.post('/api/trainings/:id/notify', async (req, res) => {
  try {
    const trainings = await readData('trainings.json');
    const employees = await readData('employees.json');
    const training = trainings.find((t: any) => t.id === req.params.id);
    
    if (!training) return res.status(404).json({ error: 'Training not found' });
    
    let sentCount = 0;
    if (training.attendees) {
      for (const attendee of training.attendees) {
        if (attendee.status === 'Planned') {
          const emp = employees.find((e: any) => e.id === attendee.employeeId);
          if (emp) {
            const email = `${emp.name.toLowerCase().replace(/\\s+/g, '.')}@mainetti.com`;
            console.log(`[MANUAL EMAIL SENT] To: ${email} | Subject: Reminder: Upcoming Training! | Message: Dear ${emp.name}, you are scheduled for the training "${training.title}" on ${training.date}. Please be ready.`);
            sentCount++;
          }
        }
      }
    }
    
    res.json({ success: true, sentCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Setup automated email reminders
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running automated email reminder check...');
      const trainings = await readData('trainings.json');
      const employees = await readData('employees.json');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const upcomingTrainings = trainings.filter((t: any) => t.date === tomorrowStr);
      
      for (const training of upcomingTrainings) {
        if (!training.attendees) continue;
        
        for (const attendee of training.attendees) {
          if (attendee.status === 'Planned') {
            const emp = employees.find((e: any) => e.id === attendee.employeeId);
            if (emp) {
              const email = `${emp.name.toLowerCase().replace(/\\s+/g, '.')}@mainetti.com`;
              console.log(`[EMAIL SENT] To: ${email} | Subject: Reminder: Upcoming Training Tomorrow! | Message: Dear ${emp.name}, you are scheduled for the training "${training.title}" on ${training.date}. Please be ready.`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in automated reminder check:', err);
    }
  });

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

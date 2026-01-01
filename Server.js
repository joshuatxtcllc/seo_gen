import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// App Templates
const templates = {
  'claude-assistant': {
    name: 'Claude AI Assistant',
    description: 'Mobile-optimized Claude chatbot with image upload',
    icon: '🤖',
    files: {
      'package.json': JSON.stringify({
        name: '{{APP_NAME}}',
        version: '1.0.0',
        type: 'module',
        scripts: { start: 'node server.js' },
        dependencies: {
          'express': '^4.18.2',
          'dotenv': '^16.3.1',
          '@anthropic-ai/sdk': '^0.27.0'
        }
      }, null, 2),
      'server.js': `import express from 'express';
import dotenv from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json({ limit: '50mb' }));

const conversations = new Map();

app.get('/', (req, res) => {
  res.send(\`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{APP_NAME}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #f1f5f9; height: 100vh; overflow: hidden; }
        .app { display: flex; flex-direction: column; height: 100vh; }
        .header { background: #1e293b; border-bottom: 1px solid #334155; padding: 12px 16px; }
        .header h1 { font-size: 18px; font-weight: 600; }
        .chat { flex: 1; overflow-y: auto; padding: 16px; }
        .welcome { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
        .message { margin-bottom: 16px; display: flex; }
        .message-user { justify-content: flex-end; }
        .message-assistant { justify-content: flex-start; }
        .message-content { max-width: 85%; padding: 12px 16px; border-radius: 16px; word-wrap: break-word; }
        .message-user .message-content { background: #6366f1; color: white; }
        .message-assistant .message-content { background: #1e293b; border: 1px solid #334155; }
        .input-area { background: #1e293b; border-top: 1px solid #334155; padding: 12px 16px; }
        .input-row { display: flex; gap: 8px; }
        #msg { flex: 1; background: #334155; border: 1px solid #334155; color: #f1f5f9; padding: 10px 12px; border-radius: 12px; font-size: 16px; resize: none; font-family: inherit; }
        #send { background: #6366f1; color: white; border: none; padding: 10px 16px; border-radius: 12px; cursor: pointer; }
        #send:disabled { background: #334155; }
    </style>
</head>
<body>
    <div class="app">
        <div class="header"><h1>🤖 {{APP_NAME}}</h1></div>
        <div id="chat" class="chat">
            <div class="welcome"><h2>👋 Welcome!</h2><p>I'm Claude, here to help!</p></div>
        </div>
        <div class="input-area">
            <div class="input-row">
                <textarea id="msg" placeholder="Ask me anything..." rows="1"></textarea>
                <button id="send">➤</button>
            </div>
        </div>
    </div>
    <script>
        let convId = null;
        const chat = document.getElementById('chat');
        const msg = document.getElementById('msg');
        const send = document.getElementById('send');
        
        send.onclick = async () => {
            const text = msg.value.trim();
            if (!text) return;
            addMsg('user', text);
            msg.value = '';
            send.disabled = true;
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, conversationId: convId })
                });
                const data = await res.json();
                convId = data.conversationId;
                addMsg('assistant', data.response);
            } catch (e) {
                addMsg('assistant', '❌ Error: ' + e.message);
            } finally {
                send.disabled = false;
            }
        };
        
        msg.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send.click();
            }
        };
        
        function addMsg(role, content) {
            const div = document.createElement('div');
            div.className = \\\`message message-\\\${role}\\\`;
            div.innerHTML = \\\`<div class="message-content">\\\${content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\\\n/g, '<br>')}</div>\\\`;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }
    </script>
</body>
</html>\`);
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const convId = conversationId || Date.now().toString();
    let history = conversations.get(convId) || [];
    history.push({ role: 'user', content: message });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: history
    });
    const assistantMessage = response.content[0].text;
    history.push({ role: 'assistant', content: assistantMessage });
    if (history.length > 20) history = history.slice(-20);
    conversations.set(convId, history);
    res.json({ response: assistantMessage, conversationId: convId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(\\\`Running on port \\\${PORT}\\\`));
`,
      '.env.example': 'ANTHROPIC_API_KEY=your_key_here',
      '.gitignore': 'node_modules\n.env\n*.log',
      'README.md': '# {{APP_NAME}}\n\nClaude AI Assistant\n\n## Setup\n1. `npm install`\n2. Create `.env` file with `ANTHROPIC_API_KEY`\n3. `npm start`'
    },
    requiredEnvVars: ['ANTHROPIC_API_KEY']
  },
  'express-api': {
    name: 'Express REST API',
    description: 'Simple Express.js REST API starter',
    icon: '🚀',
    files: {
      'package.json': JSON.stringify({
        name: '{{APP_NAME}}',
        version: '1.0.0',
        type: 'module',
        scripts: { start: 'node server.js' },
        dependencies: {
          'express': '^4.18.2',
          'dotenv': '^16.3.1',
          'cors': '^2.8.5'
        }
      }, null, 2),
      'server.js': `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to {{APP_NAME}} API!' });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, () => console.log(\`API running on port \${PORT}\`));
`,
      '.env.example': 'PORT=3000',
      '.gitignore': 'node_modules\n.env\n*.log',
      'README.md': '# {{APP_NAME}}\n\nExpress REST API\n\n## Setup\n1. `npm install`\n2. `npm start`'
    },
    requiredEnvVars: []
  }
};

// Create GitHub repo and deploy
app.post('/api/deploy', async (req, res) => {
  try {
    const { 
      appName, 
      template, 
      githubToken, 
      envVars = {} 
    } = req.body;

    if (!appName || !template || !githubToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const templateData = templates[template];
    if (!templateData) {
      return res.status(400).json({ error: 'Invalid template' });
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: githubToken });

    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();

    // Create repository
    const repoName = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: templateData.description,
      private: false,
      auto_init: true
    });

    // Create files in repository
    for (const [filename, content] of Object.entries(templateData.files)) {
      const fileContent = content.replace(/\{\{APP_NAME\}\}/g, appName);
      
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repoName,
        path: filename,
        message: `Add ${filename}`,
        content: Buffer.from(fileContent).toString('base64')
      });
    }

    res.json({
      success: true,
      repoUrl: repo.html_url,
      repoName: repoName,
      owner: user.login,
      message: 'Repository created! Now deploy to Railway manually or use Railway CLI.'
    });

  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ 
      error: 'Deployment failed', 
      details: error.message 
    });
  }
});

// Get available templates
app.get('/api/templates', (req, res) => {
  const templateList = Object.entries(templates).map(([id, data]) => ({
    id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    requiredEnvVars: data.requiredEnvVars
  }));
  
  res.json(templateList);
});

app.listen(PORT, () => {
  console.log(`🚀 AppGen Pro running on port ${PORT}`);
});

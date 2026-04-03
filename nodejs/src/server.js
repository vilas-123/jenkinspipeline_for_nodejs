const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB failed:', err.message);
    process.exit(1);
  }
};

// Schema
const userSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Manager</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; background: #f0f2f5; min-height: 100vh; padding: 40px 20px; }
    h1 { text-align: center; color: #333; margin-bottom: 30px; font-size: 28px; }

    .container { max-width: 700px; margin: 0 auto; }

    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .card h2 { font-size: 18px; color: #444; margin-bottom: 16px; }

    input { width: 100%; padding: 10px 14px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; outline: none; }
    input:focus { border-color: #4f46e5; }

    button { width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }
    button:hover { background: #4338ca; }

    .msg { padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 14px; display: none; }
    .msg.success { background: #d1fae5; color: #065f46; display: block; }
    .msg.error   { background: #fee2e2; color: #991b1b; display: block; }

    .user-list { list-style: none; }
    .user-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; background: #fafafa; }
    .user-info strong { display: block; color: #333; font-size: 15px; }
    .user-info span   { color: #888; font-size: 13px; }
    .del-btn { background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .del-btn:hover { background: #dc2626; }

    .empty { text-align: center; color: #aaa; padding: 20px; font-size: 15px; }
    .count { font-size: 13px; color: #888; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h1>👤 User Manager</h1>
  <div class="container">

    <!-- Add User -->
    <div class="card">
      <h2>➕ Add New User</h2>
      <div id="msg" class="msg"></div>
      <input type="text"  id="name"  placeholder="Full Name" />
      <input type="email" id="email" placeholder="Email Address" />
      <button onclick="addUser()">Add User</button>
    </div>

    <!-- User List -->
    <div class="card">
      <h2>📋 All Users</h2>
      <div id="count" class="count"></div>
      <ul id="user-list" class="user-list">
        <li class="empty">Loading...</li>
      </ul>
    </div>

  </div>

  <script>
    async function loadUsers() {
      const res = await fetch('/api/users');
      const data = await res.json();
      const list = document.getElementById('user-list');
      const count = document.getElementById('count');

      count.textContent = data.count + ' user(s) found';

      if (data.data.length === 0) {
        list.innerHTML = '<li class="empty">No users yet. Add one above!</li>';
        return;
      }

      list.innerHTML = data.data.map(u => \`
        <li class="user-item">
          <div class="user-info">
            <strong>\${u.name}</strong>
            <span>\${u.email}</span>
          </div>
          <button class="del-btn" onclick="deleteUser('\${u._id}')">Delete</button>
        </li>
      \`).join('');
    }

    async function addUser() {
      const name  = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const msg   = document.getElementById('msg');

      if (!name || !email) {
        msg.className = 'msg error';
        msg.textContent = '⚠️ Please fill in both fields.';
        return;
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();

      if (data.success) {
        msg.className = 'msg success';
        msg.textContent = '✅ User added successfully!';
        document.getElementById('name').value  = '';
        document.getElementById('email').value = '';
        loadUsers();
      } else {
        msg.className = 'msg error';
        msg.textContent = '❌ ' + data.error;
      }

      setTimeout(() => msg.className = 'msg', 3000);
    }

    async function deleteUser(id) {
      if (!confirm('Delete this user?')) return;
      await fetch('/api/users/' + id, { method: 'DELETE' });
      loadUsers();
    }

    loadUsers();
  </script>
</body>
</html>
  `)
});

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  });
}

module.exports = { app, User };
<DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DarkChat – Anonymous Chat</title>
    <link rel="icon" type="image/png" href="https://bucket.deepsite.design/logo.png" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body.dark { background:#0f172a; }
        .msg-bubble { animation:slideIn .3s ease-out; }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        .typing { animation:pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:.4;} 50%{opacity:1;} }
    </style>
</head>
<body class="bg-gray-50 transition-colors">
    <!-- LOGIN / SIGN-UP -->
    <section id="loginScreen" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div class="text-center mb-6">
                <i class="fas fa-comments text-5xl text-indigo-600 dark:text-indigo-400 mb-2"></i>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">DarkChat</h1>
                <p class="text-sm text-gray-600 dark:text-gray-300">Anonymous & instant</p>
            </div>

            <form id="loginForm" class="space-y-4">
                <input id="username" type="text" placeholder="Username" required
                       class="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                <input id="email" type="email" placeholder="Email (optional)"
                       class="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                <input id="password" type="password" placeholder="Password" required
                       class="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                <button type="submit"
                        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition">
                    Sign Up / Login
                </button>
            </form>

            <div class="text-center mt-4">
                <button id="toggleDark" class="text-gray-600 dark:text-gray-300">
                    <i class="fas fa-moon text-xl"></i>
                </button>
            </div>
        </div>
    </section>

    <!-- CHAT ROOM -->
    <section id="chatScreen" class="hidden h-screen flex flex-col">
        <header class="bg-white dark:bg-gray-800 shadow px-4 py-3 flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <i class="fas fa-comments text-xl text-indigo-600 dark:text-indigo-400"></i>
                <span class="font-bold text-gray-900 dark:text-white">DarkChat</span>
            </div>
            <div class="flex items-center space-x-3">
                <span id="userLabel" class="text-sm text-gray-700 dark:text-gray-300"></span>
                <button id="logoutBtn" class="text-gray-600 dark:text-gray-300 hover:text-red-500">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
                <button id="toggleDarkChat" class="text-gray-600 dark:text-gray-300">
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </header>

        <main id="chatBox" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900"></main>

        <div id="typingIndicator" class="px-4 pb-1 hidden text-sm text-gray-500 dark:text-gray-400">
            <i class="fas fa-circle text-xs typing"></i> Someone is typing…
        </div>

        <form id="msgForm" class="bg-white dark:bg-gray-800 px-4 py-3 flex space-x-2 border-t border-gray-200 dark:border-gray-700">
            <input id="msgInput" type="text" placeholder="Type a message…" autocomplete="off"
                   class="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
            <button type="submit"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition">
                <i class="fas fa-paper-plane"></i>
            </button>
        </form>
    </section>

    <script>
        /* ---------- CONFIG ---------- */
        const supabaseUrl = 'https://kkuhjbtpdtmlzazpcljv.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdWhqYnRwZHRtbHphenBjbGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTY0NTYsImV4cCI6MjA4MzAzMjQ1Nn0.uy8mcgVrZaiFtF-DPWXhjdkgOJN9ViAmuEDhMVXisMo';
        const supabase = supabase.createClient(supabaseUrl, supabaseKey);

        /* ---------- STATE ---------- */
        let user = null;
        let channel = null;

        /* ---------- INIT ---------- */
        document.addEventListener('DOMContentLoaded', () => {
            restoreTheme();
            checkAuth();
            bindEvents();
        });

        /* ---------- AUTH ---------- */
        async function checkAuth() {
            const { data: { user: u } } = await supabase.auth.getUser();
            user = u;
            user ? showChat() : showLogin();
        }

        async function handleLogin(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim() || `${username}@darkchat.local`;
            const password = document.getElementById('password').value;

            // Try sign-in first
            let { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                // Sign-up if user doesn’t exist
                ({ data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { username } }
                }));
            }
            if (error) return alert(error.message);

            user = data.user;
            showChat();
        }

        async function logout() {
            await supabase.auth.signOut();
            user = null;
            showLogin();
        }

        /* ---------- UI ---------- */
        function showLogin() {
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('chatScreen').classList.add('hidden');
            document.getElementById('loginForm').reset();
        }

        function showChat() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('chatScreen').classList.remove('hidden');
            document.getElementById('userLabel').textContent = user.user_metadata?.username || 'Anonymous';
            loadMessages();
            subscribeMessages();
        }

        /* ---------- MESSAGES ---------- */
        async function loadMessages() {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(100);
            if (error) return;
            const box = document.getElementById('chatBox');
            box.innerHTML = '';
            data.forEach(renderMessage);
            box.scrollTop = box.scrollHeight;
        }

        function subscribeMessages() {
            channel = supabase
                .channel('msgs')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                    renderMessage(payload.new);
                    const box = document.getElementById('chatBox');
                    box.scrollTop = box.scrollHeight;
                })
                .subscribe();
        }

        function renderMessage(m) {
            const box = document.getElementById('chatBox');
            const isOwn = m.user_id === user.id;
            const div = document.createElement('div');
            div.className = `flex ${isOwn ? 'justify-end' : 'justify-start'} msg-bubble`;
            div.innerHTML = `
                <div class="max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${isOwn ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'}">
                    <div class="text-xs mb-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}">${m.username || 'Anonymous'}</div>
                    <div>${m.content}</div>
                    <div class="text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}">${new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
            `;
            box.appendChild(div);
        }

        async function sendMessage(e) {
            e.preventDefault();
            const input = document.getElementById('msgInput');
            const text = input.value.trim();
            if (!text) return;
            await supabase.from('messages').insert({
                user_id: user.id,
                username: user.user_metadata?.username || 'Anonymous',
                content: text
            });
            input.value = '';
        }

        /* ---------- THEME ---------- */
        function toggleDark() {
            document.body.classList.toggle('dark');
            localStorage.setItem('dark', document.body.classList.contains('dark'));
        }
        function restoreTheme() {
            if (localStorage.getItem('dark') === 'true') document.body.classList.add('dark');
        }

        /* ---------- EVENTS ---------- */
        function bindEvents() {
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('logoutBtn').addEventListener('click', logout);
            document.getElementById('msgForm').addEventListener('submit', sendMessage);
            document.getElementById('toggleDark').addEventListener('click', toggleDark);
            document.getElementById('toggleDarkChat').addEventListener('click', toggleDark);
        }
    </script>
</body>
</html>

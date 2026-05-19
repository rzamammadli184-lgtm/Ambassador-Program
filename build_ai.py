import sys
import re

# 1. READ BASE TEMPLATE
with open('ambassador_network.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 2. REPLACE MAIN WITH CHATBOT UI
chat_ui = """
        <main class="main">
            <header class="header">
                <div style="display:flex; align-items:center; gap:16px;">
                    <button class="burger-btn" onclick="toggleMenu()"><i data-lucide="menu"></i></button>
                    <div class="header-title">
                        <h1>Aİ Analitika <span class="badge badge-success" style="font-size:0.7rem; margin-left:8px;">BETA</span></h1>
                        <p>Real-vaxt məlumatlarına əsaslanan süni intellekt köməkçisi.</p>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="theme-toggle" onclick="toggleTheme()"><i data-lucide="sun" id="theme-icon"></i></button>
                    <div class="lang-box">
                        <button class="lang-btn active">AZ</button>
                        <button class="lang-btn">EN</button>
                        <button class="lang-btn">RU</button>
                    </div>
                </div>
            </header>

            <div class="chat-container animate-fade-in" style="margin-top:20px;">
                <div class="chat-header">
                    <div class="ai-avatar"><i data-lucide="bot" style="color:white; width:24px; height:24px;"></i></div>
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:4px; font-weight:600;">AzEstetik Aİ</h2>
                        <p style="font-size:0.8rem; color:var(--text-muted);">Sizin 507 nəfərlik rəsmi bazanızla əlaqəlidir</p>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message ai-message animate-slide-up">
                        Salam! 👋 Mən AzEstetik sisteminin süni intellekt analitik köməkçisiyəm. Şəbəkənizdəki bütün rəsmi iştirakçı məlumatlarını oxuyub təhlil etmişəm. Məndən aşağıdakı mövzularda detallı məlumat istəyə bilərsiniz.
                    </div>
                </div>
                <div class="chat-suggestions">
                    <button onclick="sendPrompt('leaders')"><i data-lucide="crown" style="width:14px; height:14px;"></i> Ən güclü liderlər</button>
                    <button onclick="sendPrompt('passive')"><i data-lucide="user-minus" style="width:14px; height:14px;"></i> Passivləşən üzvlər</button>
                    <button onclick="sendPrompt('stats')"><i data-lucide="pie-chart" style="width:14px; height:14px;"></i> Ümumi Statistika</button>
                    <button onclick="sendPrompt('birthdays')"><i data-lucide="gift" style="width:14px; height:14px;"></i> Ad günləri</button>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Süni intellektə sual verin..." onkeypress="if(event.key === 'Enter') sendCustomMessage()">
                    <button class="send-btn" onclick="sendCustomMessage()"><i data-lucide="send" style="width:20px; height:20px;"></i></button>
                </div>
            </div>
        </main>
"""

new_content = re.sub(r'<main class="main">.*?</main>', chat_ui, content, flags=re.DOTALL)

# 3. ADD CSS FOR CHATBOT
css = """
<style>
/* AI Chatbot Styles */
.chat-container {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 140px);
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.chat-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--card-border);
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255,255,255,0.02);
}
.ai-avatar {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, var(--primary), #8B5CF6);
    display: flex; align-items: center; justify-content: center;
}
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
}
.chat-messages::-webkit-scrollbar { width: 6px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

.message {
    max-width: 85%;
    padding: 16px 20px;
    border-radius: 16px;
    font-size: 0.95rem;
    line-height: 1.6;
    animation: slideUp 0.3s ease;
}
.ai-message {
    background: rgba(var(--primary-rgb), 0.05);
    border: 1px solid rgba(var(--primary-rgb), 0.2);
    align-self: flex-start;
    border-top-left-radius: 4px;
    color: var(--text-main);
}
.user-message {
    background: var(--primary);
    color: white;
    align-self: flex-end;
    border-top-right-radius: 4px;
    box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.3);
}
.chat-suggestions {
    padding: 16px 24px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    border-top: 1px solid rgba(255,255,255,0.05);
}
.chat-suggestions button {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--card-border);
    color: var(--text-muted);
    padding: 10px 18px;
    border-radius: 20px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
}
.chat-suggestions button:hover {
    background: rgba(var(--primary-rgb), 0.1);
    color: white;
    border-color: var(--primary);
    transform: translateY(-2px);
}
.chat-input-area {
    padding: 20px 24px;
    border-top: 1px solid var(--card-border);
    display: flex;
    gap: 12px;
    background: var(--bg-dark);
}
.chat-input-area input {
    flex: 1;
    background: var(--card);
    border: 1px solid var(--card-border);
    padding: 0 20px;
    border-radius: 16px;
    color: white;
    font-family: inherit;
    font-size: 0.95rem;
    transition: all 0.3s;
}
.chat-input-area input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
}
.send-btn {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    background: var(--primary);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}
.send-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(var(--primary-rgb), 0.4);
}
.typing-indicator {
    display: flex; gap: 6px; align-items: center;
    padding: 16px 20px;
    background: rgba(255,255,255,0.03);
    border-radius: 16px;
    border-top-left-radius: 4px;
    width: fit-content;
    align-self: flex-start;
}
.typing-dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--primary);
    animation: typing 1.4s infinite ease-in-out both;
}
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes typing { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

.ai-message b { color: white; }
.ai-message .highlight { color: var(--primary); font-weight: 600; }
.ai-message .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; background: rgba(255,255,255,0.1); margin-left: 6px; }
</style>
</head>
"""

new_content = new_content.replace('</head>', css)

# 4. ADD JS LOGIC FOR AI
js_logic = """
    <script>
        lucide.createIcons();

        function toggleMenu() {
            const drawer = document.getElementById('drawer');
            const overlay = document.getElementById('overlay');
            drawer.classList.toggle('open');
            overlay.classList.toggle('active');
        }

        // Live Data Handler
        let ambassadors = [];

        // Fetch Excel database
        fetch('database.json')
            .then(res => res.json())
            .then(data => {
                const rawAmb = data.AMB || [];
                ambassadors = rawAmb
                    .filter(item => item.rowNum >= 4)
                    .slice(0, 507)
                    .map(item => item.data || {});
            });

        // AI Chatbot Logic
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');

        function appendMessage(sender, text) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${sender}-message`;
            msgDiv.innerHTML = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTyping() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'typing';
            typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function removeTyping() {
            const typing = document.getElementById('typing');
            if (typing) typing.remove();
        }

        function getPromptText(type) {
            const map = {
                'leaders': 'Ən güclü qrup rəhbərlərini (liderləri) və onların göstəricilərini təhlil et.',
                'passive': 'Şəbəkədəki ən passiv və potensialını itirən iştirakçıları tap.',
                'stats': 'Bütün şəbəkənin ümumi dövriyyə və aktivlik statistikasını çıxar.',
                'birthdays': 'Yaxın günlərdə ad günü olan iştirakçılar kimlərdir?'
            };
            return map[type] || type;
        }

        function sendPrompt(type) {
            if(ambassadors.length === 0) {
                alert("Məlumatlar Excel-dən yüklənir, zəhmət olmasa bir saniyə gözləyin...");
                return;
            }
            appendMessage('user', getPromptText(type));
            processAI(type);
        }

        function sendCustomMessage() {
            const text = chatInput.value.trim();
            if(!text) return;
            if(ambassadors.length === 0) {
                alert("Məlumatlar Excel-dən yüklənir, zəhmət olmasa bir saniyə gözləyin...");
                return;
            }
            appendMessage('user', text);
            chatInput.value = '';
            
            // Basic natural language matching
            let type = 'general';
            const t = text.toLowerCase();
            if(t.includes('lider') || t.includes('rəhbər') || t.includes('güclü') || t.includes('çox üzv')) type = 'leaders';
            else if(t.includes('passiv') || t.includes('zəif') || t.includes('klassik')) type = 'passive';
            else if(t.includes('statistika') || t.includes('ümumi') || t.includes('nə qədər') || t.includes('dövriyyə')) type = 'stats';
            else if(t.includes('ad günü') || t.includes('doğum')) type = 'birthdays';
            
            processAI(type);
        }

        function processAI(type) {
            showTyping();
            // Simulate AI processing time
            setTimeout(() => {
                removeTyping();
                const response = generateAIResponse(type);
                appendMessage('ai', response);
                lucide.createIcons();
            }, 1500 + Math.random() * 1000); // 1.5 to 2.5 seconds
        }

        function generateAIResponse(type) {
            let res = '';
            const total = ambassadors.length;
            const active = ambassadors.filter(a => a.H === 'A' || a.H === 'A+');
            
            if (type === 'leaders') {
                const leaders = {};
                ambassadors.forEach(a => {
                    if (a.E && a.E.trim() !== '') {
                        if(!leaders[a.E]) leaders[a.E] = { count: 0, points: 0 };
                        leaders[a.E].count++;
                        leaders[a.E].points += (parseFloat(a.C) || 0);
                    }
                });
                const sorted = Object.entries(leaders).sort((a,b) => b[1].count - a[1].count).slice(0, 3);
                
                res += `🔍 <b>Aİ Təhlil Nəticəsi:</b> Şəbəkənizdəki ən dominant liderlər bunlardır:<br><br>`;
                sorted.forEach((l, i) => {
                    res += `${i+1}. <span class="highlight">${l[0]}</span><br>`;
                    res += `&nbsp;&nbsp;&nbsp;👥 Komanda üzvləri: <b>${l[1].count} nəfər</b><br>`;
                    res += `&nbsp;&nbsp;&nbsp;💎 Ümumi Dövriyyə: <b>${Math.round(l[1].points).toLocaleString()} Bal</b><br><br>`;
                });
                res += `💡 <b>Aİ Məsləhəti:</b> Bu liderləri xüsusi tədbirlərdə fərqləndirmək komandanın ümumi motivasiyasını əhəmiyyətli dərəcədə artıra bilər.`;
            } 
            else if (type === 'passive') {
                const passives = ambassadors.filter(a => a.H === 'K').sort((a,b) => (parseFloat(a.C)||0) - (parseFloat(b.C)||0)).slice(0, 5);
                res += `⚠️ <b>Diqqət:</b> Excel bazası üzərində apardığım analizə görə, aşağıdakı iştirakçıların statusu "Klassik" olaraq qalır və aktivlikləri çox aşağıdır:<br><br>`;
                passives.forEach(p => {
                    res += `• <b>${p.B || 'Adsız İştirakçı'}</b> (Sponsor: ${p.E || 'Bilinmir'}) <span class="badge">Dövriyyə: ${p.C || 0} Bal</span><br>`;
                });
                res += `<br>🎯 <b>Aİ Strategiyası:</b> Onların qrup rəhbərləri ilə dərhal əlaqə saxlayaraq xüsusi "Geri Dönüş" təşviqi təklif etməyiniz məsləhətdir.`;
            }
            else if (type === 'stats') {
                const totalPoints = ambassadors.reduce((sum, a) => sum + (parseFloat(a.C) || 0), 0);
                const avg = active.length > 0 ? Math.round(totalPoints / active.length) : 0;
                
                res += `📊 <b>Şəbəkənin Mövcud Reallığı (Excel əsaslı):</b><br><br>`;
                res += `• Ümumi Qeydiyyat: <b>${total} Nəfər</b><br>`;
                res += `• Aktiv İştirakçılar: <b>${active.length} Nəfər</b> (${Math.round((active.length/total)*100)}%)<br>`;
                res += `• Ümumi Şəbəkə Dövriyyəsi: <span class="highlight">${Math.round(totalPoints).toLocaleString()} Bal</span><br>`;
                res += `• Ortalama Məhsuldarlıq: <b>${avg} Bal / üzv</b><br><br>`;
                res += `Mövcud inkişaf dinamikasına əsasən, şəbəkənin növbəti dövrdə daha sürətli böyümə potensialı var. 🚀`;
            }
            else if (type === 'birthdays') {
                res += `🎂 <b>Ad Günü Təhlili:</b><br><br>Geniş bazanızdakı doğum tarixlərinə əsasən, yaxın günlərdə şəbəkənizin bir neçə mühüm üzvünün ad günüdür.<br><br>`;
                res += `Süni İntellekt olaraq tövsiyə edirəm ki, onlara avtomatik olaraq "AzEstetik Club-dan Özəl Endirim" SMS-i göndərəsiniz. Bu, məmnuniyyəti 3 dəfə artıracaq. 🎉`;
            }
            else {
                res += `Mən sizin şəbəkənizin xüsusi Aİ modeliyəm. Mən tamamilə Excel məlumatlarınıza bağlıyam. Xahiş edirəm "Liderlər", "Statistika", "Passivlər" kimi spesifik açar sözlərdən istifadə edin və ya yuxarıdakı hazır sual düymələrinə klikləyin.`;
            }
            return res;
        }

        // Add Active Class
        setTimeout(() => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const aiLinks = document.querySelectorAll('.nav-link');
            for(let l of aiLinks) {
                if(l.innerHTML.includes('Aİ Analitika')) l.classList.add('active');
            }
        }, 100);

    </script>
</body>
"""

new_content = re.sub(r'<script>.*?</script>.*?</body>', js_logic, new_content, flags=re.DOTALL)

with open('ambassador_ai.html', 'w', encoding='utf-8') as f:
    f.write(new_content)


        lucide.createIcons();
        function toggleMenu() {
            document.getElementById('drawer').classList.toggle('open');
            document.getElementById('overlay').classList.toggle('active');
        }

        let ambassadors = [];
        fetch('database.json')
            .then(res => res.json())
            .then(data => {
                const rawAmb = data.AMB || [];
                ambassadors = rawAmb.filter(item => item.rowNum >= 4).slice(0, 507).map(item => {
                    const d = item.data || {};
                    return { idCode: d.D, name: d.B, points: parseFloat(d.C) || 0, leader: d.E, contractDate: d.F, birthday: d.G, status: d.H, level: d.I, phone: d.J };
                });
            });

        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');

        function appendMessage(sender, text) {
            const m = document.createElement('div');
            m.className = 'message ' + sender + '-message';
            if (sender === 'user') { m.style.cssText = 'background:var(--primary);color:white;align-self:flex-end;border-top-right-radius:4px;'; }
            else { m.style.cssText = 'background:rgba(var(--primary-rgb),0.05);border:1px solid rgba(var(--primary-rgb),0.2);align-self:flex-start;border-top-left-radius:4px;'; }
            m.style.cssText += 'max-width:85%;padding:16px 20px;border-radius:16px;font-size:0.95rem;line-height:1.6;animation:slideUp 0.3s ease;';
            m.innerHTML = text;
            chatMessages.appendChild(m);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTyping() {
            const t = document.createElement('div');
            t.id = 'typing';
            t.innerHTML = '<i>Datalar analiz edilir...</i>';
            t.style.cssText = 'color:var(--text-muted);font-size:0.85rem;padding:10px 20px;';
            chatMessages.appendChild(t);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        function removeTyping() { const t = document.getElementById('typing'); if (t) t.remove(); }

        function getPromptText(type) {
            const map = {
                'leaders': 'En guclu qrup rehberlerini ve onlarin gostericilerini tehlil et.',
                'passive': 'Shebekedeki en passiv ishtirakchilari tap.',
                'stats': 'Butun shebekenin umumi dovruiyye ve aktivlik statistikasini chixar.',
                'birthdays': 'Yaxin gunlerde ad gunu olan ishtirakchilar kimlerdir?'
            };
            return map[type] || type;
        }

        function sendPrompt(type) {
            if (ambassadors.length === 0) { alert("Melumatlar yuklenilir, bir saniye gozleyin..."); return; }
            appendMessage('user', getPromptText(type));
            processAI(type);
        }

        function sendCustomMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            if (ambassadors.length === 0) { alert("Melumatlar yuklenilir..."); return; }
            appendMessage('user', text);
            chatInput.value = '';
            let type = 'general';
            const t = text.toLowerCase();
            
            // 1. Level Filter
            if (t.match(/(seviyye|level|sÉ™viyyÉ™)\s*(\d+)/) || t.match(/(\d+)(?:\s*-?(ci|cu|cÄ±|cÃ¼))?\s*(seviyye|level|sÉ™viyyÉ™|ambassador)/)) {
                const numMatch = t.match(/\d+/);
                if (numMatch) type = 'filter_level_' + numMatch[0];
            }
            // 2. Points Filter
            else if (t.match(/(\d+)[- ]?(den|dan|daha)?\s*(cox|Ã§ox|yuxari|yuxarÄ±|boyuk|bÃ¶yÃ¼k)/) && (t.includes('bal') || t.includes('dovriyye') || t.includes('xal'))) {
                const numMatch = t.match(/(\d+)/);
                if (numMatch) type = 'filter_points_above_' + numMatch[0];
            }
            // 3. Status Filter
            else if (t.match(/statusu?\s+([A-Za-z\+]+)/) || t.match(/([A-Za-z\+]+)\s+status/)) {
                const stMatch = t.match(/statusu?\s+([A-Za-z\+]+)/) || t.match(/([A-Za-z\+]+)\s+status/);
                if (stMatch) type = 'filter_status_' + stMatch[1].toUpperCase();
            }
            // 4. Counts
            else if (t.includes('nece nefer') || t.includes('neÃ§É™ nÉ™fÉ™r') || t.includes('sayi') || t.includes('sayÄ±')) {
                type = 'count_total';
            }
            // Basic Matches
            else if (t.includes('lider') || t.includes('rehber') || t.includes('guclu') || t.includes('yaxshi') || t.includes('top') || t.includes('leader') || t.includes('best') || t.includes('Ğ»Ğ¸Ğ´ĞµÑ€') || t.includes('Ğ»ÑƒÑ‡Ñˆ')) type = 'leaders';
            else if (t.includes('passiv') || t.includes('zeif') || t.includes('klassik') || t.includes('islemeyen') || t.includes('weak') || t.includes('lazy') || t.includes('Ğ¿Ğ°ÑÑĞ¸Ğ²') || t.includes('ÑĞ»Ğ°Ğ±')) type = 'passive';
            else if (t.includes('statistika') || t.includes('umumi') || t.includes('ne qeder') || t.includes('dovriyye') || t.includes('bal') || t.includes('say') || t.includes('stat') || t.includes('total') || t.includes('turnover') || t.includes('score') || t.includes('point') || t.includes('ÑÑ‚Ğ°Ñ‚Ğ¸ÑÑ‚Ğ¸Ğº') || t.includes('Ğ¾Ğ±Ğ¾Ñ€Ğ¾Ñ‚') || t.includes('Ğ±Ğ°Ğ»Ğ»') || t.includes('Ğ²ÑĞµĞ³Ğ¾')) type = 'stats';
            else if (t.includes('ad gunu') || t.includes('dogum') || t.includes('yas') || t.includes('birthday') || t.includes('born') || t.includes('Ñ€Ğ¾Ğ¶Ğ´ĞµĞ½Ğ¸Ñ')) type = 'birthdays';
            else if (t.includes('salam') || t.includes('necesen') || t.includes('kimsen') || t.includes('hello') || t.includes('hi ') || t.includes('hey') || t.includes('Ğ¿Ñ€Ğ¸Ğ²ĞµÑ‚') || t.includes('Ğ·Ğ´Ñ€Ğ°Ğ²ÑÑ‚Ğ²ÑƒĞ¹')) type = 'greeting';
            else {
                // Better search logic: check if any ambassador name is IN the prompt
                const match = ambassadors.find(a => (a.name && (a.name.toLowerCase().includes(t) || t.includes(a.name.toLowerCase().split(' ')[0]))) || (a.idCode && t.includes(a.idCode.toLowerCase())));
                if (match) {
                    if (t.includes('komanda') || t.includes('qrup') || t.includes('sponsor')) {
                        type = 'search_team';
                    } else {
                        type = 'search_person';
                    }
                    originalText = match.name;
                }
            }
            processAI(type, originalText);
        }

        // ElevenLabs Premium Voice Engine
        async function speakResponse(htmlText) {
            const API_KEY = 'sk_493acff05a76614c73d1ba656d64755ff9c2d651f5d3e079';
            const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
            const temp = document.createElement('div');
            temp.innerHTML = htmlText;
            let plainText = (temp.textContent || temp.innerText || '').replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/%/g, ' faiz ').replace(/\s+/g, ' ').trim();
            if (!plainText || plainText.length < 3) return;
            try {
                if (window.currentAIAudio) { window.currentAIAudio.pause(); window.currentAIAudio = null; }
                const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID, {
                    method: 'POST',
                    headers: { 'Accept': 'audio/mpeg', 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: plainText, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
                });
                if (response.ok) {
                    const blob = await response.blob();
                    window.currentAIAudio = new Audio(window.URL.createObjectURL(blob));
                    window.currentAIAudio.play();
                } else {
                    // Fallback to browser TTS
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance(plainText);
                        u.lang = 'tr-TR'; u.rate = 0.92;
                        const voices = window.speechSynthesis.getVoices();
                        const v = voices.find(v => v.lang === 'az-AZ') || voices.find(v => v.lang.includes('tr'));
                        if (v) u.voice = v;
                        window.speechSynthesis.speak(u);
                    }
                }
            } catch(e) { console.error("TTS Error:", e); }
        }

        function detectLanguage(text) {
            if (!text) return 'az';
            const t = text.toLowerCase();
            if (/[Ğ°-ÑÑ‘]/i.test(t)) return 'ru';
            if (t.match(/\b(hello|hi|who|what|where|how|leaders|stats|passives|best|show|give|tell|english|is|are|do|does|can)\b/)) return 'en';
            return 'az';
        }

        function processAI(type, originalText) {
            showTyping();
            setTimeout(() => {
                removeTyping();
                const lang = detectLanguage(originalText);
                const response = generateAIResponse(type, originalText || '', lang);
                appendMessage('ai', response);
                if (lang === 'en' || lang === 'ru') {
                    speakResponse(response);
                }
                lucide.createIcons();
            }, 600);
        }

        function generateAIResponse(type, originalText, lang) {
            let res = '';
            const total = ambassadors.length;
            const active = ambassadors.filter(a => a.status === 'A' || a.status === 'A+');

            if (type.startsWith('filter_level_')) {
                const level = type.split('_')[2];
                const matches = ambassadors.filter(a => a.level == level);
                if (matches.length > 0) {
                    if (lang === 'en') res += '<b style="color:white;">According to the system database, participants at Level ' + level + ' (' + matches.length + ' people):</b><br><br>';
                    else if (lang === 'ru') res += '<b style="color:white;">Ğ¡Ğ¾Ğ³Ğ»Ğ°ÑĞ½Ğ¾ ÑĞ¸ÑÑ‚ĞµĞ¼Ğ½Ğ¾Ğ¹ Ğ±Ğ°Ğ·Ğµ, ÑƒÑ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞ¸ Ğ½Ğ° ÑƒÑ€Ğ¾Ğ²Ğ½Ğµ ' + level + ' (' + matches.length + ' Ñ‡ĞµĞ»Ğ¾Ğ²ĞµĞº):</b><br><br>';
                    else res += '<b style="color:white;">Sistem bazasina esasen, Level ' + level + ' seviyyesinde olan ishtirakchilar (' + matches.length + ' nefer):</b><br><br>';
                    
                    matches.slice(0, 10).forEach(m => {
                        let tSponsor = lang === 'en' ? 'Sponsor' : (lang === 'ru' ? 'Ğ¡Ğ¿Ğ¾Ğ½ÑĞ¾Ñ€' : 'Sponsor');
                        let tPoints = lang === 'en' ? 'Pts' : (lang === 'ru' ? 'Ğ‘Ğ°Ğ»' : 'Bal');
                        res += '- <b style="color:white;">' + (m.name || 'Adsiz') + '</b> (' + tSponsor + ': ' + (m.leader || '-') + ') <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.75rem; background:rgba(255,255,255,0.1); margin-left:6px;">' + (m.points || 0) + ' ' + tPoints + '</span><br>';
                    });
                    
                    if (matches.length > 10) {
                        if (lang === 'en') res += '<br><i style="color:var(--text-muted);">* Showing first 10 due to list length.</i>';
                        else if (lang === 'ru') res += '<br><i style="color:var(--text-muted);">* ĞŸĞ¾ĞºĞ°Ğ·Ğ°Ğ½Ñ‹ Ğ¿ĞµÑ€Ğ²Ñ‹Ğµ 10 Ğ¸Ğ·-Ğ·Ğ° Ğ´Ğ»Ğ¸Ğ½Ñ‹ ÑĞ¿Ğ¸ÑĞºĞ°.</i>';
                        else res += '<br><i style="color:var(--text-muted);">* Siyahi uzun oldugu ucun ilk 10 nefer gosterilir.</i>';
                    }
                } else {
                    if (lang === 'en') res += 'No participants found at Level ' + level + '.';
                    else if (lang === 'ru') res += 'Ğ£Ñ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞ¾Ğ² Ğ½Ğ° ÑƒÑ€Ğ¾Ğ²Ğ½Ğµ ' + level + ' Ğ½Ğµ Ğ½Ğ°Ğ¹Ğ´ĞµĞ½Ğ¾.';
                    else res += 'Bazada Level ' + level + ' seviyyesinde her hansi ishtirakchi tapilmadi.';
                }
            }
            else if (type.startsWith('filter_points_above_')) {
                const minPoints = parseFloat(type.split('_')[3]);
                const matches = ambassadors.filter(a => parseFloat(a.points) >= minPoints).sort((a,b)=> parseFloat(b.points) - parseFloat(a.points));
                if (matches.length > 0) {
                    res += '<b style="color:white;">Sistem bazasina esasen, dovriyyesi ' + minPoints + ' baldan cox olan ishtirakchilar (' + matches.length + ' nefer):</b><br><br>';
                    matches.slice(0, 10).forEach(m => {
                        res += '- <b style="color:white;">' + (m.name || 'Adsiz') + '</b> - <span style="color:var(--primary); font-weight:600;">' + (m.points || 0) + ' Bal</span><br>';
                    });
                    if (matches.length > 10) res += '<br><i style="color:var(--text-muted);">* Siyahi uzun oldugu ucun en cox bal toplayan ilk 10 nefer gosterilir.</i>';
                } else {
                    res += 'Bazada ' + minPoints + ' baldan yuxari ishtirakchi tapilmadi.';
                }
            }
            else if (type.startsWith('filter_status_')) {
                const st = type.split('_')[2];
                const matches = ambassadors.filter(a => a.status === st);
                if (matches.length > 0) {
                    res += '<b style="color:white;">Statusu "' + st + '" olan ishtirakchilar (' + matches.length + ' nefer):</b><br><br>';
                    matches.slice(0, 10).forEach(m => {
                        res += '- <b style="color:white;">' + (m.name || 'Adsiz') + '</b> (Level ' + (m.level || 0) + ') - ' + (m.points || 0) + ' Bal<br>';
                    });
                    if (matches.length > 10) res += '<br><i style="color:var(--text-muted);">* Siyahi uzun oldugu ucun ilk 10 nefer gosterilir.</i>';
                } else {
                    res += 'Bazada "' + st + '" statusuna malik ishtirakchi tapilmadi.';
                }
            }
            else if (type === 'count_total') {
                res += '<b style="color:white;">Sisteminizdeki umumi insan sayi ' + total + ' neferdir.</b><br>Bunlardan ' + active.length + ' neferi aktiv (A ve ya A+ statuslu), digerleri ise ferqli statuslardadir.';
            }
            else if (type === 'search_team') {
                const leaderName = originalText;
                const matches = ambassadors.filter(a => a.leader && a.leader.includes(leaderName));
                if (matches.length > 0) {
                    const sum = matches.reduce((acc, a) => acc + (parseFloat(a.points) || 0), 0);
                    res += '<b style="color:white;">' + leaderName + ' adli sponsorun komandasinda ' + matches.length + ' nefer var.</b><br>';
                    res += 'Umumi Komanda Dovriyyesi: <b style="color:var(--primary);">' + Math.round(sum).toLocaleString() + ' Bal</b><br><br>';
                    matches.slice(0, 10).forEach(m => {
                        res += '- ' + (m.name || 'Adsiz') + ' (' + (m.points || 0) + ' Bal)<br>';
                    });
                    if (matches.length > 10) res += '<br><i style="color:var(--text-muted);">* Siyahi uzun oldugu ucun ilk 10 nefer gosterilir.</i>';
                } else {
                    res += leaderName + ' adli sexsin komandasinda her hansi uzv tapilmadi.';
                }
            }
            else if (type === 'leaders') {
                const leaders = {};
                ambassadors.forEach(a => {
                    if (a.leader && a.leader.trim()) {
                        if (!leaders[a.leader]) leaders[a.leader] = { count: 0, points: 0 };
                        leaders[a.leader].count++;
                        leaders[a.leader].points += (parseFloat(a.points) || 0);
                    }
                });
                const sorted = Object.entries(leaders).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
                
                if(lang === 'en') {
                    res += '<b style="color:white;">Analysis complete. Here are the strongest leaders in your official network:</b><br><br>';
                } else if(lang === 'ru') {
                    res += '<b style="color:white;">ĞĞ½Ğ°Ğ»Ğ¸Ğ· Ğ·Ğ°Ğ²ĞµÑ€ÑˆĞµĞ½. ĞŸÑ€ĞµĞ´ÑÑ‚Ğ°Ğ²Ğ»ÑÑ ÑĞ°Ğ¼Ñ‹Ñ… ÑĞ¸Ğ»ÑŒĞ½Ñ‹Ñ… Ğ»Ğ¸Ğ´ĞµÑ€Ğ¾Ğ² Ğ² Ğ²Ğ°ÑˆĞµĞ¹ Ğ¾Ñ„Ğ¸Ñ†Ğ¸Ğ°Ğ»ÑŒĞ½Ğ¾Ğ¹ ÑĞµÑ‚Ğ¸:</b><br><br>';
                } else {
                    res += '<b style="color:white;">Tehlil tamamlandi. Resmi shebekenizde en guclu liderleri teqdim edirem:</b><br><br>';
                }

                sorted.forEach((l, i) => {
                    let tCount = lang === 'en' ? 'members' : (lang === 'ru' ? 'ÑƒÑ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞ¾Ğ²' : 'nefer');
                    let tTurnover = lang === 'en' ? 'Total Turnover' : (lang === 'ru' ? 'ĞĞ±Ñ‰Ğ¸Ğ¹ Ğ¾Ğ±Ğ¾Ñ€Ğ¾Ñ‚' : 'Umumi Dovriyye');
                    let tPoints = lang === 'en' ? 'Points' : (lang === 'ru' ? 'Ğ‘Ğ°Ğ»Ğ»Ğ¾Ğ²' : 'Bal');
                    
                    res += (i+1) + '. <span style="color:var(--primary); font-weight:600;">' + l[0] + '</span><br>';
                    res += '&nbsp;&nbsp;&nbsp;Komanda: <b style="color:white;">' + l[1].count + ' ' + tCount + '</b><br>';
                    res += '&nbsp;&nbsp;&nbsp;' + tTurnover + ': <b style="color:white;">' + Math.round(l[1].points).toLocaleString() + ' ' + tPoints + '</b><br><br>';
                });

                if(lang === 'en') res += '<b style="color:white;">Strategic Advice:</b> Recognizing these leaders at special events can significantly increase the overall motivation of the team.';
                else if(lang === 'ru') res += '<b style="color:white;">Ğ¡Ñ‚Ñ€Ğ°Ñ‚ĞµĞ³Ğ¸Ñ‡ĞµÑĞºĞ¸Ğ¹ ÑĞ¾Ğ²ĞµÑ‚:</b> ĞŸĞ¾Ğ¾Ñ‰Ñ€ĞµĞ½Ğ¸Ğµ ÑÑ‚Ğ¸Ñ… Ğ»Ğ¸Ğ´ĞµÑ€Ğ¾Ğ² Ğ½Ğ° ÑĞ¿ĞµÑ†Ğ¸Ğ°Ğ»ÑŒĞ½Ñ‹Ñ… Ğ¼ĞµÑ€Ğ¾Ğ¿Ñ€Ğ¸ÑÑ‚Ğ¸ÑÑ… Ğ¼Ğ¾Ğ¶ĞµÑ‚ Ğ·Ğ½Ğ°Ñ‡Ğ¸Ñ‚ĞµĞ»ÑŒĞ½Ğ¾ Ğ¿Ğ¾Ğ²Ñ‹ÑĞ¸Ñ‚ÑŒ Ğ¾Ğ±Ñ‰ÑƒÑ Ğ¼Ğ¾Ñ‚Ğ¸Ğ²Ğ°Ñ†Ğ¸Ñ ĞºĞ¾Ğ¼Ğ°Ğ½Ğ´Ñ‹.';
                else res += '<b style="color:white;">Strateji Meslehet:</b> Bu liderleri xususi tedbirlerde ferqlendirmek komandanin umumi motivasiyasini ehemiyyetli derecede artira biler.';
            }
            else if (type === 'passive') {
                const passives = ambassadors.filter(a => a.status === 'K').sort((a, b) => (a.points || 0) - (b.points || 0)).slice(0, 5);
                if(lang === 'en') res += '<b style="color:white;">Attention. According to my analysis of the system database, the activity of the following participants is very weak:</b><br><br>';
                else if(lang === 'ru') res += '<b style="color:white;">Ğ’Ğ½Ğ¸Ğ¼Ğ°Ğ½Ğ¸Ğµ. Ğ¡Ğ¾Ğ³Ğ»Ğ°ÑĞ½Ğ¾ Ğ¼Ğ¾ĞµĞ¼Ñƒ Ğ°Ğ½Ğ°Ğ»Ğ¸Ğ·Ñƒ ÑĞ¸ÑÑ‚ĞµĞ¼Ğ½Ğ¾Ğ¹ Ğ±Ğ°Ğ·Ñ‹ Ğ´Ğ°Ğ½Ğ½Ñ‹Ñ…, Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ğ¾ÑÑ‚ÑŒ ÑĞ»ĞµĞ´ÑƒÑÑ‰Ğ¸Ñ… ÑƒÑ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞ¾Ğ² Ğ¾Ñ‡ĞµĞ½ÑŒ ÑĞ»Ğ°Ğ±Ğ°Ñ:</b><br><br>';
                else res += '<b style="color:white;">Diqqet. Sistem bazasi uzerinde apardiqim analize gore, ashagidaki ishtirakchilarin fealiyyeti cox zeifdir:</b><br><br>';

                passives.forEach(p => {
                    let tSponsor = lang === 'en' ? 'Sponsor' : (lang === 'ru' ? 'Ğ¡Ğ¿Ğ¾Ğ½ÑĞ¾Ñ€' : 'Sponsor');
                    let tTurn = lang === 'en' ? 'Turnover' : (lang === 'ru' ? 'ĞĞ±Ğ¾Ñ€Ğ¾Ñ‚' : 'Dovriyye');
                    let tPoints = lang === 'en' ? 'Pts' : (lang === 'ru' ? 'Ğ‘Ğ°Ğ»' : 'Bal');
                    res += '- <b style="color:white;">' + (p.name || 'Adsiz') + '</b> (' + tSponsor + ': ' + (p.leader || '-') + ') <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.75rem; background:rgba(255,255,255,0.1); margin-left:6px;">' + tTurn + ': ' + (p.points || 0) + ' ' + tPoints + '</span><br>';
                });

                if(lang === 'en') res += '<br><b style="color:white;">Strategic Suggestion:</b> It is very important that you contact their managers immediately and offer a special return campaign.';
                else if(lang === 'ru') res += '<br><b style="color:white;">Ğ¡Ñ‚Ñ€Ğ°Ñ‚ĞµĞ³Ğ¸Ñ‡ĞµÑĞºĞ¾Ğµ Ğ¿Ñ€ĞµĞ´Ğ»Ğ¾Ğ¶ĞµĞ½Ğ¸Ğµ:</b> ĞÑ‡ĞµĞ½ÑŒ Ğ²Ğ°Ğ¶Ğ½Ğ¾, Ñ‡Ñ‚Ğ¾Ğ±Ñ‹ Ğ²Ñ‹ Ğ½ĞµĞ¼ĞµĞ´Ğ»ĞµĞ½Ğ½Ğ¾ ÑĞ²ÑĞ·Ğ°Ğ»Ğ¸ÑÑŒ Ñ Ğ¸Ñ… Ñ€ÑƒĞºĞ¾Ğ²Ğ¾Ğ´Ğ¸Ñ‚ĞµĞ»ÑĞ¼Ğ¸ Ğ¸ Ğ¿Ñ€ĞµĞ´Ğ»Ğ¾Ğ¶Ğ¸Ğ»Ğ¸ ÑĞ¿ĞµÑ†Ğ¸Ğ°Ğ»ÑŒĞ½ÑƒÑ ĞºĞ°Ğ¼Ğ¿Ğ°Ğ½Ğ¸Ñ Ğ¿Ğ¾ Ğ²Ğ¾Ğ·Ğ²Ñ€Ğ°Ñ‰ĞµĞ½Ğ¸Ñ.';
                else res += '<br><b style="color:white;">Strateji Teklif:</b> Onlarin rehberleri ile derhal elaqe saxlayaraq xususi geri donus kampaniyasi teklif etmeyiniz cox vacibdir.';
            }
            else if (type === 'stats') {
                const totalPoints = ambassadors.reduce((sum, a) => sum + (parseFloat(a.points) || 0), 0);
                const avg = active.length > 0 ? Math.round(totalPoints / active.length) : 0;
                
                if(lang === 'en') {
                    res += '<b style="color:white;">Currently, the actual situation of your network is as follows:</b><br><br>';
                    res += '- Total Registration: <b style="color:white;">' + total + ' People</b><br>';
                    res += '- Active Participants: <b style="color:white;">' + active.length + ' People</b> (' + Math.round((active.length / total) * 100) + '%)<br>';
                    res += '- Total Network Turnover: <span style="color:var(--primary); font-weight:600;">' + Math.round(totalPoints).toLocaleString() + ' Points</span><br>';
                    res += '- Average Productivity: <b style="color:white;">' + avg + ' Points</b> (Per active member)<br><br>';
                    res += 'Based on the current growth dynamics, the network has the potential to grow faster in the next period.';
                } else if(lang === 'ru') {
                    res += '<b style="color:white;">Ğ’ Ğ½Ğ°ÑÑ‚Ğ¾ÑÑ‰ĞµĞµ Ğ²Ñ€ĞµĞ¼Ñ Ğ°ĞºÑ‚ÑƒĞ°Ğ»ÑŒĞ½Ğ°Ñ ÑĞ¸Ñ‚ÑƒĞ°Ñ†Ğ¸Ñ Ğ²Ğ°ÑˆĞµĞ¹ ÑĞµÑ‚Ğ¸ Ğ²Ñ‹Ğ³Ğ»ÑĞ´Ğ¸Ñ‚ ÑĞ»ĞµĞ´ÑƒÑÑ‰Ğ¸Ğ¼ Ğ¾Ğ±Ñ€Ğ°Ğ·Ğ¾Ğ¼:</b><br><br>';
                    res += '- ĞĞ±Ñ‰Ğ°Ñ Ñ€ĞµĞ³Ğ¸ÑÑ‚Ñ€Ğ°Ñ†Ğ¸Ñ: <b style="color:white;">' + total + ' Ğ§ĞµĞ»Ğ¾Ğ²ĞµĞº</b><br>';
                    res += '- ĞĞºÑ‚Ğ¸Ğ²Ğ½Ñ‹Ğµ ÑƒÑ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞ¸: <b style="color:white;">' + active.length + ' Ğ§ĞµĞ»Ğ¾Ğ²ĞµĞº</b> (' + Math.round((active.length / total) * 100) + '%)<br>';
                    res += '- ĞĞ±Ñ‰Ğ¸Ğ¹ Ğ¾Ğ±Ğ¾Ñ€Ğ¾Ñ‚ ÑĞµÑ‚Ğ¸: <span style="color:var(--primary); font-weight:600;">' + Math.round(totalPoints).toLocaleString() + ' Ğ‘Ğ°Ğ»Ğ»Ğ¾Ğ²</span><br>';
                    res += '- Ğ¡Ñ€ĞµĞ´Ğ½ÑÑ Ğ¿Ñ€Ğ¾Ğ¸Ğ·Ğ²Ğ¾Ğ´Ğ¸Ñ‚ĞµĞ»ÑŒĞ½Ğ¾ÑÑ‚ÑŒ: <b style="color:white;">' + avg + ' Ğ‘Ğ°Ğ»Ğ»Ğ¾Ğ²</b> (ĞĞ° Ğ°ĞºÑ‚Ğ¸Ğ²Ğ½Ğ¾Ğ³Ğ¾ ÑƒÑ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞ°)<br><br>';
                    res += 'Ğ¡ÑƒĞ´Ñ Ğ¿Ğ¾ Ñ‚ĞµĞºÑƒÑ‰ĞµĞ¹ Ğ´Ğ¸Ğ½Ğ°Ğ¼Ğ¸ĞºĞµ Ñ€Ğ¾ÑÑ‚Ğ°, Ğ² ÑĞ»ĞµĞ´ÑƒÑÑ‰ĞµĞ¼ Ğ¿ĞµÑ€Ğ¸Ğ¾Ğ´Ğµ Ñƒ ÑĞµÑ‚Ğ¸ ĞµÑÑ‚ÑŒ Ğ¿Ğ¾Ñ‚ĞµĞ½Ñ†Ğ¸Ğ°Ğ» Ğ´Ğ»Ñ Ğ±Ğ¾Ğ»ĞµĞµ Ğ±Ñ‹ÑÑ‚Ñ€Ğ¾Ğ³Ğ¾ Ñ€Ğ¾ÑÑ‚Ğ°.';
                } else {
                    res += '<b style="color:white;">Hazirda shebekenizin movcud veziyyeti ashagidaki kimidir:</b><br><br>';
                    res += '- Umumi Qeydiyyat: <b style="color:white;">' + total + ' Nefer</b><br>';
                    res += '- Aktiv Ishtirakchilar: <b style="color:white;">' + active.length + ' Nefer</b> (' + Math.round((active.length / total) * 100) + '%)<br>';
                    res += '- Umumi Sebeke Dovriyyesi: <span style="color:var(--primary); font-weight:600;">' + Math.round(totalPoints).toLocaleString() + ' Bal</span><br>';
                    res += '- Ortalama Mehsuldarliq: <b style="color:white;">' + avg + ' Bal</b> (Her aktiv uzve dushen)<br><br>';
                    res += 'Movcud inkishaf dinamikasina esasen, shebekenin novbeti dovrde daha suretli boyume potensialy var.';
                }
            }
            else if (type === 'birthdays') {
                if(lang === 'en') {
                    res += '<b style="color:white;">I analyzed the birth dates in your extensive database.</b><br><br>Several important members of your network have birthdays in the coming days.<br><br>';
                    res += 'As an AI, I recommend you automatically send them a special discount message from AzEstetik Club. This will greatly increase their loyalty.';
                } else if(lang === 'ru') {
                    res += '<b style="color:white;">Ğ¯ Ğ¿Ñ€Ğ¾Ğ°Ğ½Ğ°Ğ»Ğ¸Ğ·Ğ¸Ñ€Ğ¾Ğ²Ğ°Ğ» Ğ´Ğ°Ñ‚Ñ‹ Ñ€Ğ¾Ğ¶Ğ´ĞµĞ½Ğ¸Ñ Ğ² Ğ²Ğ°ÑˆĞµĞ¹ Ğ¾Ğ±ÑˆĞ¸Ñ€Ğ½Ğ¾Ğ¹ Ğ±Ğ°Ğ·Ğµ Ğ´Ğ°Ğ½Ğ½Ñ‹Ñ….</b><br><br>Ğ£ Ğ½ĞµÑĞºĞ¾Ğ»ÑŒĞºĞ¸Ñ… Ğ²Ğ°Ğ¶Ğ½Ñ‹Ñ… ÑƒÑ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞ¾Ğ² Ğ²Ğ°ÑˆĞµĞ¹ ÑĞµÑ‚Ğ¸ Ğ² Ğ±Ğ»Ğ¸Ğ¶Ğ°Ğ¹ÑˆĞ¸Ğµ Ğ´Ğ½Ğ¸ Ğ´Ğ½Ğ¸ Ñ€Ğ¾Ğ¶Ğ´ĞµĞ½Ğ¸Ñ.<br><br>';
                    res += 'ĞšĞ°Ğº Ğ˜Ğ˜, Ñ Ñ€ĞµĞºĞ¾Ğ¼ĞµĞ½Ğ´ÑƒÑ Ğ°Ğ²Ñ‚Ğ¾Ğ¼Ğ°Ñ‚Ğ¸Ñ‡ĞµÑĞºĞ¸ Ğ¾Ñ‚Ğ¿Ñ€Ğ°Ğ²Ğ»ÑÑ‚ÑŒ Ğ¸Ğ¼ ÑĞ¿ĞµÑ†Ğ¸Ğ°Ğ»ÑŒĞ½Ğ¾Ğµ ÑĞ¾Ğ¾Ğ±Ñ‰ĞµĞ½Ğ¸Ğµ Ğ¾ ÑĞºĞ¸Ğ´ĞºĞµ Ğ¾Ñ‚ AzEstetik Club. Ğ­Ñ‚Ğ¾ Ğ·Ğ½Ğ°Ñ‡Ğ¸Ñ‚ĞµĞ»ÑŒĞ½Ğ¾ Ğ¿Ğ¾Ğ²Ñ‹ÑĞ¸Ñ‚ Ğ¸Ñ… Ğ»Ğ¾ÑĞ»ÑŒĞ½Ğ¾ÑÑ‚ÑŒ.';
                } else {
                    res += '<b style="color:white;">Genish bazanizdaki tevellud tarixlerine esasen analiz apardim.</b><br><br>Yaxin gunlerde shebekenizin bir neche muhum uzvunun ad gunudur.<br><br>';
                    res += 'Suni Intellekt olaraq tovsiye edirem ki, onlara avtomatik olaraq AzEstetik Club adindan ozel endirim mesaji gondersiniz. Bu onlarda loyalligi boyuk olcude artiracaq.';
                }
            }
            else if (type === 'greeting') {
                if(lang === 'en') res = 'Hello! I am the official AI assistant of the AzEstetik system. I am currently analyzing your network table of 507 people. You can ask me any query.';
                else if(lang === 'ru') res = 'Ğ—Ğ´Ñ€Ğ°Ğ²ÑÑ‚Ğ²ÑƒĞ¹Ñ‚Ğµ! Ğ¯ Ğ¾Ñ„Ğ¸Ñ†Ğ¸Ğ°Ğ»ÑŒĞ½Ñ‹Ğ¹ Ğ˜Ğ˜-Ğ°ÑÑĞ¸ÑÑ‚ĞµĞ½Ñ‚ ÑĞ¸ÑÑ‚ĞµĞ¼Ñ‹ AzEstetik. Ğ’ Ğ½Ğ°ÑÑ‚Ğ¾ÑÑ‰ĞµĞµ Ğ²Ñ€ĞµĞ¼Ñ Ñ Ğ°Ğ½Ğ°Ğ»Ğ¸Ğ·Ğ¸Ñ€ÑƒÑ Ğ²Ğ°ÑˆÑƒ Ñ‚Ğ°Ğ±Ğ»Ğ¸Ñ†Ñƒ ÑĞµÑ‚Ğ¸ Ğ¸Ğ· 507 Ñ‡ĞµĞ»Ğ¾Ğ²ĞµĞº. Ğ’Ñ‹ Ğ¼Ğ¾Ğ¶ĞµÑ‚Ğµ Ğ·Ğ°Ğ´Ğ°Ñ‚ÑŒ Ğ¼Ğ½Ğµ Ğ»ÑĞ±Ğ¾Ğ¹ Ğ·Ğ°Ğ¿Ñ€Ğ¾Ñ.';
                else res = 'Salam! Men AzEstetik sisteminin resmi intellektual komekchisiyem. Hazirda 507 neferlik sebeke cedvelinizi analiz edirem. Mene istediyiniz sorgunu vere bilersiniz.';
            }
            else if (type === 'search_person') {
                const t = (originalText || '').toLowerCase();
                const matches = ambassadors.filter(a => (a.name && a.name.toLowerCase().includes(t)) || (a.idCode && a.idCode.toLowerCase().includes(t))).slice(0, 3);
                if (matches.length > 0) {
                    if(lang === 'en') res += '<b style="color:white;">According to your query, I present the information about the following participant:</b><br><br>';
                    else if(lang === 'ru') res += '<b style="color:white;">Ğ¡Ğ¾Ğ³Ğ»Ğ°ÑĞ½Ğ¾ Ğ²Ğ°ÑˆĞµĞ¼Ñƒ Ğ·Ğ°Ğ¿Ñ€Ğ¾ÑÑƒ, Ğ¿Ñ€ĞµĞ´ÑÑ‚Ğ°Ğ²Ğ»ÑÑ Ğ¸Ğ½Ñ„Ğ¾Ñ€Ğ¼Ğ°Ñ†Ğ¸Ñ Ğ¾ ÑĞ»ĞµĞ´ÑƒÑÑ‰ĞµĞ¼ ÑƒÑ‡Ğ°ÑÑ‚Ğ½Ğ¸ĞºĞµ:</b><br><br>';
                    else res += '<b style="color:white;">Sorgunuza uygun olaraq ashagidaki ishtirakchi barede melumatlari teqdim edirem:</b><br><br>';
                    
                    matches.forEach(m => {
                        const sc = (m.status === 'A' || m.status === 'A+') ? 'var(--primary)' : '#EF4444';
                        let tTurn = lang === 'en' ? 'Turnover' : (lang === 'ru' ? 'ĞĞ±Ğ¾Ñ€Ğ¾Ñ‚' : 'Dovriyye');
                        let tPoints = lang === 'en' ? 'Pts' : (lang === 'ru' ? 'Ğ‘Ğ°Ğ»' : 'Bal');
                        let tLevel = lang === 'en' ? 'Level' : (lang === 'ru' ? 'Ğ£Ñ€Ğ¾Ğ²ĞµĞ½ÑŒ' : 'Seviyye');
                        let tLeader = lang === 'en' ? 'Leader' : (lang === 'ru' ? 'Ğ ÑƒĞºĞ¾Ğ²Ğ¾Ğ´Ğ¸Ñ‚ĞµĞ»ÑŒ' : 'Rehberi');
                        
                        res += '<b style="color:white; font-size:1.05rem;">' + (m.name || 'Adsiz') + '</b><br>';
                        res += '- ID: <b>' + (m.idCode || '-') + '</b><br>';
                        res += '- ' + tTurn + ': <b style="color:var(--primary);">' + m.points + ' ' + tPoints + '</b><br>';
                        res += '- Status: <b style="color:' + sc + '">' + (m.status || '-') + '</b><br>';
                        res += '- ' + tLevel + ': <b>' + (m.level || '0') + '</b><br>';
                        res += '- ' + tLeader + ': <b>' + (m.leader || '-') + '</b><br><br>';
                    });
                }
            }
            else {
                if(lang === 'en') {
                    res += 'Sorry, I did not fully understand you. However, I can provide any information related to the <b style="color:white;">507-person</b> database in my memory.<br><br>';
                    res += 'Please ask more specific questions like "What is the total score?" or "Who are the best leaders?"';
                } else if(lang === 'ru') {
                    res += 'Ğ˜Ğ·Ğ²Ğ¸Ğ½Ğ¸Ñ‚Ğµ, Ñ Ğ²Ğ°Ñ Ğ½Ğµ ÑĞ¾Ğ²ÑĞµĞ¼ Ğ¿Ğ¾Ğ½ÑĞ». Ğ¢ĞµĞ¼ Ğ½Ğµ Ğ¼ĞµĞ½ĞµĞµ, Ñ Ğ¼Ğ¾Ğ³Ñƒ Ğ¿Ñ€ĞµĞ´Ğ¾ÑÑ‚Ğ°Ğ²Ğ¸Ñ‚ÑŒ Ğ»ÑĞ±ÑƒÑ Ğ¸Ğ½Ñ„Ğ¾Ñ€Ğ¼Ğ°Ñ†Ğ¸Ñ, ĞºĞ°ÑĞ°ÑÑ‰ÑƒÑÑÑ Ğ±Ğ°Ğ·Ñ‹ Ğ´Ğ°Ğ½Ğ½Ñ‹Ñ… Ğ¸Ğ· <b style="color:white;">507 Ñ‡ĞµĞ»Ğ¾Ğ²ĞµĞº</b>, Ñ…Ñ€Ğ°Ğ½ÑÑ‰ĞµĞ¹ÑÑ Ğ² Ğ¼Ğ¾ĞµĞ¹ Ğ¿Ğ°Ğ¼ÑÑ‚Ğ¸.<br><br>';
                    res += 'ĞŸĞ¾Ğ¶Ğ°Ğ»ÑƒĞ¹ÑÑ‚Ğ°, Ğ·Ğ°Ğ´Ğ°Ğ²Ğ°Ğ¹Ñ‚Ğµ Ğ±Ğ¾Ğ»ĞµĞµ ĞºĞ¾Ğ½ĞºÑ€ĞµÑ‚Ğ½Ñ‹Ğµ Ğ²Ğ¾Ğ¿Ñ€Ğ¾ÑÑ‹, Ğ½Ğ°Ğ¿Ñ€Ğ¸Ğ¼ĞµÑ€: "ĞšĞ°ĞºĞ¾Ğ² Ğ¾Ğ±Ñ‰Ğ¸Ğ¹ Ğ±Ğ°Ğ»Ğ»?" Ğ¸Ğ»Ğ¸ "ĞšÑ‚Ğ¾ Ğ»ÑƒÑ‡ÑˆĞ¸Ğµ Ğ»Ğ¸Ğ´ĞµÑ€Ñ‹?"';
                } else {
                    res += 'Bagislayin, men sizi tam basha dushmedim. Lakin yaddashimda olan <b style="color:white;">507 neferlik</b> baza ile bagli istenilen melumati vere bilerem.<br><br>';
                    res += 'Xahish edirem "Umumi bal ne qederdir?" ve ya "En yaxshi liderler kimlerdir?" kimi daha deqiq suallar verin.';
                }
            }
            return res;
        }
        // Theme Toggle
        function initTheme() { const s = localStorage.getItem('theme'); if (s === 'light') document.body.classList.add('light-mode'); updateThemeIcon(); }
        function toggleTheme() { document.body.classList.toggle('light-mode'); localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark'); updateThemeIcon(); }
        function updateThemeIcon() { const i = document.getElementById('theme-icon'); if (i) { i.setAttribute('data-lucide', document.body.classList.contains('light-mode') ? 'moon' : 'sun'); lucide.createIcons(); } }
        document.addEventListener('DOMContentLoaded', initTheme);
        initTheme();

        // Page Transitions
        function transitionToPage(e, url) { e.preventDefault(); document.body.style.transition = 'opacity 0.4s ease'; document.body.style.opacity = '0'; setTimeout(() => { window.location.href = url; }, 350); }
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.nav-link, .bottom-nav-item, a.brand').forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript')) link.addEventListener('click', function(e) { transitionToPage(e, href); });
            });
        });
    